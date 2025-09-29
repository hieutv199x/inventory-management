import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { setActiveOrganization } from '@/lib/tenant-context';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    const body = await req.json().catch(() => ({}));
    const { orgId } = body;
    if (!orgId) {
      return NextResponse.json({ error: 'orgId required' }, { status: 400 });
    }

    const membership = await prisma.organizationMember.findFirst({ where: { userId: user.id, orgId } });
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of organization' }, { status: 403 });
    }

    await setActiveOrganization(user.id, orgId, prisma);

    return NextResponse.json({ data: { success: true } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to switch organization' }, { status: e.status || 500 });
  } finally {
    await prisma.$disconnect();
  }
}
