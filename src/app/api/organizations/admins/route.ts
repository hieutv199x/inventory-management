import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { resolveOrgContext } from '@/lib/tenant-context';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/*
  POST /api/organizations/admins
  Body: { username: string; password?: string; name?: string }
  Creates a brand new system user (if username unused) and assigns ADMIN membership to active organization.
  Only SUPER_ADMIN can call this.
*/
export async function POST(req: NextRequest) {
    try {
        const { user } = await getUserWithShopAccess(req, prisma);
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { username, password, name } = body;
        if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

        const ctx = await resolveOrgContext(req, prisma);
        if (!ctx.org) return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
        const orgId = ctx.org.id;

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            // If user already exists, ensure not already member then add membership as ADMIN.
            const already = await prisma.organizationMember.findUnique({ where: { orgId_userId: { orgId, userId: existingUser.id } } });
            if (already) return NextResponse.json({ error: 'ALREADY_MEMBER' }, { status: 409 });
            const membership = await prisma.organizationMember.create({ data: { orgId, userId: existingUser.id, role: 'ADMIN' } });
            return NextResponse.json({ data: { userId: existingUser.id, membershipId: membership.id, existing: true } });
        }

        const rawPassword = password || Math.random().toString(36).slice(2, 12);
        const hashed = await bcrypt.hash(rawPassword, 10);

        const newUser = await prisma.user.create({ data: { username, name: name || username, password: hashed, role: 'ADMIN' } });
        const membership = await prisma.organizationMember.create({ data: { orgId, userId: newUser.id, role: 'ADMIN' } });

        return NextResponse.json({ data: { userId: newUser.id, membershipId: membership.id, tempPassword: password ? null : rawPassword } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'FAILED' }, { status: e.status || 500 });
    } finally {
        await prisma.$disconnect();
    }
}
