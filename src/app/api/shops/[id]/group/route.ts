import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserWithShopAccess } from '@/lib/auth';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await getUserWithShopAccess(request, prisma);
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const isOrgAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role as string);

    if (!isOrgAdmin) {
      return NextResponse.json({ error: 'Only administrators can move shops between groups' }, { status: 403 });
    }

    const { groupId } = await request.json();

    const shop = await prisma.shopAuthorization.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        orgId: true,
        groupId: true,
      },
    });

    if (!shop || shop.orgId !== org.id) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (groupId && typeof groupId !== 'string') {
      return NextResponse.json({ error: 'groupId must be a string or null' }, { status: 400 });
    }

    if (groupId) {
      const targetGroup = await prisma.shopGroup.findUnique({
        where: { id: groupId },
        select: { id: true, orgId: true },
      });

      if (!targetGroup || targetGroup.orgId !== org.id) {
        return NextResponse.json({ error: 'Target group not found in this organization' }, { status: 404 });
      }
    }

    await prisma.shopAuthorization.update({
      where: { id: shop.id },
      data: {
        groupId: groupId || null,
      },
    });

    if (groupId) {
      // Remove access for users who no longer belong to the new group
      const activeMembers = await prisma.shopGroupMember.findMany({
        where: {
          groupId,
          isActive: true,
        },
        select: { userId: true, role: true },
      });

      const allowedUserIds = new Set<string>(activeMembers.map((member) => member.userId));

      if (allowedUserIds.size > 0) {
        await prisma.userShopRole.deleteMany({
          where: {
            shopId: shop.id,
            userId: {
              notIn: Array.from<string>(allowedUserIds),
            },
          },
        });
      }

      const managerMembership = activeMembers.find((member) => member.role === 'MANAGER');

      if (managerMembership) {
        await prisma.userShopRole.upsert({
          where: {
            userId_shopId: {
              userId: managerMembership.userId,
              shopId: shop.id,
            },
          },
          update: {
            role: 'OWNER',
          },
          create: {
            userId: managerMembership.userId,
            shopId: shop.id,
            role: 'OWNER',
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shop group assignment:', error);
    return NextResponse.json({ error: 'Failed to move shop between groups' }, { status: 500 });
  }
}
