import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserWithShopAccess } from '@/lib/auth';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

const groupInclude = {
  manager: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
        },
      },
    },
  },
  _count: {
    select: {
      shops: true,
    },
  },
} satisfies Prisma.ShopGroupInclude;

type GroupWithRelations = Prisma.ShopGroupGetPayload<{
  include: typeof groupInclude;
}>;

const serializeGroup = (group: GroupWithRelations) => ({
  id: group.id,
  name: group.name,
  description: group.description,
  manager: group.manager,
  members: group.members.map((member) => ({
    id: member.id,
    user: member.user,
    role: member.role,
    isDefault: member.isDefault,
    isActive: member.isActive,
  })),
  shopCount: group._count.shops,
  createdAt: group.createdAt.toISOString(),
  updatedAt: group.updatedAt.toISOString(),
});

async function loadGroupOrThrow(id: string) {
  const group = await prisma.shopGroup.findUnique({
    where: { id },
    include: groupInclude,
  });

  if (!group) {
    throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
  }

  return group;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, isAdmin } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const group = await loadGroupOrThrow(params.id);

    if (group.orgId !== org.id) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!isAdmin) {
      const membership = await prisma.shopGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ group: serializeGroup(group) });
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    console.error('Error fetching shop group detail:', error);
    return NextResponse.json({ error: 'Failed to fetch group detail' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const group = await loadGroupOrThrow(params.id);

    if (group.orgId !== org.id) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isOrgAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role as string);
    const isGroupManager = group.managerId === user.id;

    if (!isOrgAdmin && !isGroupManager) {
      return NextResponse.json({ error: 'Only administrators or the group manager can update this group' }, { status: 403 });
    }

    const payload = await request.json();
    const { name, description, managerId, memberIds, defaultMemberId } = payload as {
      name?: string;
      description?: string | null;
      managerId?: string;
      memberIds?: string[];
      defaultMemberId?: string | null;
    };

    const updates: Prisma.ShopGroupUpdateInput = {};

    if (typeof name === 'string') {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Group name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    let targetManagerId = group.managerId;

    if (managerId) {
      const managerMembership = await prisma.organizationMember.findFirst({
        where: { orgId: org.id, userId: managerId },
      });

      if (!managerMembership) {
        return NextResponse.json({ error: 'Manager must belong to this organization' }, { status: 400 });
      }

      targetManagerId = managerId;
      updates.manager = { connect: { id: managerId } };
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updates).length > 0) {
        await tx.shopGroup.update({
          where: { id: group.id },
          data: updates,
        });
      }

      const resolvedMemberIds = Array.isArray(memberIds)
        ? Array.from(new Set([...memberIds, targetManagerId]))
        : Array.from(new Set([...(group.members.map((m) => m.userId)), targetManagerId]));

      const orgMemberships = await tx.organizationMember.findMany({
        where: {
          orgId: org.id,
          userId: { in: resolvedMemberIds },
        },
        select: { userId: true },
      });

      const missingMembers = resolvedMemberIds.filter(
        (memberId) => !orgMemberships.some((membership) => membership.userId === memberId),
      );

      if (missingMembers.length > 0) {
        throw Object.assign(new Error('INVALID_MEMBERS'), { status: 400, missingMembers });
      }

      const existingMembers = await tx.shopGroupMember.findMany({
        where: { groupId: group.id },
      });

      const existingIds = new Set(existingMembers.map((member) => member.userId));
      const resolvedIds = new Set(resolvedMemberIds);

      const removeIds = Array.from(existingIds).filter(
        (memberId) => !resolvedIds.has(memberId) && memberId !== targetManagerId,
      );

      if (removeIds.length > 0) {
        await tx.shopGroupMember.deleteMany({
          where: {
            groupId: group.id,
            userId: { in: removeIds },
          },
        });
      }

      for (const memberId of resolvedMemberIds) {
        await tx.shopGroupMember.upsert({
          where: {
            groupId_userId: {
              groupId: group.id,
              userId: memberId,
            },
          },
          update: {
            role: memberId === targetManagerId ? 'MANAGER' : 'MEMBER',
            isActive: true,
          },
          create: {
            groupId: group.id,
            userId: memberId,
            role: memberId === targetManagerId ? 'MANAGER' : 'MEMBER',
            isDefault: memberId === targetManagerId,
            isActive: true,
          },
        });
      }

      if (defaultMemberId) {
        await tx.shopGroupMember.updateMany({
          where: { groupId: group.id },
          data: { isDefault: false },
        });

        await tx.shopGroupMember.update({
          where: {
            groupId_userId: {
              groupId: group.id,
              userId: defaultMemberId,
            },
          },
          data: { isDefault: true },
        });
      }
    });

    const refreshedGroup = await loadGroupOrThrow(group.id);
    return NextResponse.json({ group: serializeGroup(refreshedGroup) });
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (error?.status === 400) {
      return NextResponse.json({ error: 'Invalid group configuration', details: error?.missingMembers }, { status: 400 });
    }

    console.error('Error updating shop group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const group = await loadGroupOrThrow(params.id);

    if (group.orgId !== org.id) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const isOrgAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role as string);

    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Only administrators can delete a group' }, { status: 403 });
    }

    const linkedShops = await prisma.shopAuthorization.count({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
    });

    if (linkedShops > 0) {
      return NextResponse.json({ error: 'Cannot delete a group with active shops' }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.shopGroupMember.deleteMany({ where: { groupId: group.id } }),
      prisma.shopGroup.delete({ where: { id: group.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    console.error('Error deleting shop group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
