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
    where: { isActive: true },
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
  })),
  shopCount: group._count.shops,
  createdAt: group.createdAt.toISOString(),
  updatedAt: group.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const membershipGroupIds = (user.groupMemberships ?? [])
      .filter((membership) => membership.isActive)
      .map((membership) => membership.groupId);

    const where: Prisma.ShopGroupWhereInput = {
      orgId: org.id,
    };

    if (!isAdmin) {
      if (membershipGroupIds.length === 0) {
        return NextResponse.json({ groups: [] });
      }

      where.id = { in: membershipGroupIds };
    }

    const groups = await prisma.shopGroup.findMany({
      where,
      include: groupInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return NextResponse.json({ groups: groups.map(serializeGroup) });
  } catch (error) {
    console.error('Error fetching shop groups:', error);
    return NextResponse.json({ error: 'Failed to fetch shop groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const isOrgAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role as string);
    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Only administrators can create groups' }, { status: 403 });
    }

    const { name, description, managerId, memberIds } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    if (!managerId || typeof managerId !== 'string') {
      return NextResponse.json({ error: 'Manager is required for a group' }, { status: 400 });
    }

    const managerMembership = await prisma.organizationMember.findFirst({
      where: { orgId: org.id, userId: managerId },
    });

    if (!managerMembership) {
      return NextResponse.json({ error: 'Manager must belong to this organization' }, { status: 400 });
    }

    const requestedMemberIds: string[] = Array.isArray(memberIds) ? memberIds : [];
    const uniqueMemberIds = Array.from(new Set([...requestedMemberIds, managerId]));

    const orgMemberships = await prisma.organizationMember.findMany({
      where: {
        orgId: org.id,
        userId: { in: uniqueMemberIds },
      },
      select: {
        userId: true,
      },
    });

    const missingMembers = uniqueMemberIds.filter(
      (memberId) => !orgMemberships.some((membership) => membership.userId === memberId),
    );

    if (missingMembers.length > 0) {
      return NextResponse.json({ error: 'All members must belong to this organization', missingMembers }, { status: 400 });
    }

    const group = await prisma.shopGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        orgId: org.id,
        managerId,
        members: {
          create: uniqueMemberIds.map((memberId) => ({
            userId: memberId,
            role: memberId === managerId ? 'MANAGER' : 'MEMBER',
            isDefault: memberId === managerId,
            isActive: true,
          })),
        },
      },
      include: groupInclude,
    });

    return NextResponse.json({ group: serializeGroup(group) }, { status: 201 });
  } catch (error) {
    console.error('Error creating shop group:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create shop group' }, { status: 500 });
  }
}
