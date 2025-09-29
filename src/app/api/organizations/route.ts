import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';
import { resolveOrgContext } from '@/lib/tenant-context';
import { audit } from '@/lib/audit';
import { findPlan } from '@/lib/plans';

const prisma = new PrismaClient();

function slugify(name: string) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let candidate = base || 'org';
  let i = 1;
  while (true) {
    const existing = await prisma.organization.findFirst({ where: { slug: candidate } });
    if (!existing) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    // We can leverage membership join directly
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' }
    });

    // Also resolve active context for convenience
    const ctx = await resolveOrgContext(req, prisma);
    const activeOrgId = ctx.org?.id || null;

    await audit(prisma, { orgId: activeOrgId || 'none', userId: user.id, action: 'ORG_MEMBERSHIPS_LIST' });

    return NextResponse.json({
      data: memberships.map(m => ({
        orgId: m.orgId,
        membershipId: m.id,
        role: m.role,
        name: m.organization.name,
        slug: m.organization.slug,
        status: m.organization.status,
        active: m.orgId === activeOrgId
      }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to list organizations' }, { status: e.status || 500 });
  } finally { await prisma.$disconnect(); }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getUserWithShopAccess(req, prisma);
    const body = await req.json().catch(()=>({}));
    const { name } = body;
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name too short' }, { status: 400 });
    }
    const baseSlug = slugify(name);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create org + membership in transaction
    const result = await prisma.$transaction(async tx => {
      const org = await tx.organization.create({ data: { name, slug } });
      await tx.organizationMember.create({ data: { orgId: org.id, userId: user.id, role: 'OWNER' } });
      // Set as active for user's sessions
      await tx.session.updateMany({ where: { userId: user.id }, data: { activeOrgId: org.id } });
      await audit(tx as any, { orgId: org.id, userId: user.id, action: 'ORG_CREATE', metadata: { name, slug } });
      return org;
    });

    return NextResponse.json({ data: { id: result.id, slug: result.slug } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create organization' }, { status: e.status || 500 });
  } finally { await prisma.$disconnect(); }
}
