import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { resolveOrgContext, requireOrg } from '@/lib/tenant-context';
import { getActiveMembership, canManageMembers } from '@/lib/org-permissions';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    const superAdmin = user.role === 'SUPER_ADMIN';
  if (!superAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const orgResult = await resolveOrgContext(req, prisma);
  if (!orgResult.org) return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
  const org = orgResult.org;

    const members = await prisma.organizationMember.findMany({
      where: { orgId: org.id },
      include: { user: { select: { id: true, name: true, username: true, role: true, isActive: true } } },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ data: members.map(m => ({
      id: m.id,
      userId: m.userId,
      orgId: m.orgId,
      role: m.role,
      inviteStatus: m.inviteStatus,
      createdAt: m.createdAt,
      user: m.user
    })) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  } finally { await prisma.$disconnect(); }
}

export async function POST() {
  return NextResponse.json({ error: 'ADD_MEMBER_DISABLED' }, { status: 405 });
}

