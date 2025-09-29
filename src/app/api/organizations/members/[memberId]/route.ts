import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { resolveOrgContext, requireOrg } from '@/lib/tenant-context';
import { getActiveMembership, canManageMembers, canChangeRole, canRemoveMember } from '@/lib/org-permissions';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { memberId: string } }) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    const orgResult = await resolveOrgContext(req, prisma);
    const org = requireOrg(orgResult);
    const acting = await getActiveMembership(prisma, user.id, org.id);
    if (!acting || !canManageMembers(acting.role)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { role } = body;
    if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });

    const target = await prisma.organizationMember.findUnique({ where: { id: params.memberId } });
    if (!target || target.orgId !== org.id) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    if (!canChangeRole(acting.role, target.role)) return NextResponse.json({ error: 'CANNOT_CHANGE_ROLE' }, { status: 403 });

    const updated = await prisma.organizationMember.update({ where: { id: target.id }, data: { role } });
    return NextResponse.json({ data: { id: updated.id, role: updated.role } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  } finally { await prisma.$disconnect(); }
}

export async function DELETE(req: NextRequest, { params }: { params: { memberId: string } }) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    const orgResult = await resolveOrgContext(req, prisma);
    const org = requireOrg(orgResult);
    const acting = await getActiveMembership(prisma, user.id, org.id);
    if (!acting || !canManageMembers(acting.role)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

    const target = await prisma.organizationMember.findUnique({ where: { id: params.memberId } });
    if (!target || target.orgId !== org.id) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    if (!canRemoveMember(acting.role, target.role)) return NextResponse.json({ error: 'CANNOT_REMOVE' }, { status: 403 });

    await prisma.organizationMember.delete({ where: { id: target.id } });
    return NextResponse.json({ data: { deleted: true } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  } finally { await prisma.$disconnect(); }
}
