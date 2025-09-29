import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { getActiveMembership } from '@/lib/org-permissions';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    const membership = await getActiveMembership(prisma, user.id, params.orgId);
    if (!membership || !['OWNER','ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const body = await req.json().catch(()=>({}));
    const data: any = {};
    if (body.name && body.name.length >= 2) data.name = body.name;
    if (body.status && ['ACTIVE','SUSPENDED','CLOSED'].includes(body.status)) data.status = body.status;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });
    const updated = await prisma.organization.update({ where: { id: params.orgId }, data });
    return NextResponse.json({ data: { id: updated.id, name: updated.name, status: updated.status } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update organization' }, { status: e.status || 500 });
  } finally { await prisma.$disconnect(); }
}
