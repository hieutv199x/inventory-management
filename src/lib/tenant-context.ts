import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';
import { verifyToken } from './auth';

/**
 * Resolved organization context shape returned to API handlers.
 */
export interface OrgContext {
  id: string;
  slug: string;
  status: string;
  planId?: string | null;
  featureOverrides?: any;
}

/**
 * Resolve active organization for the current session (token based). If user has multiple organizations and no activeOrgId
 * is set, we return a flag so UI can prompt for selection.
 */
export async function resolveOrgContext(req: NextRequest, prisma: PrismaClient) {
  const decoded = verifyToken(req);
  const userId = decoded.userId as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isSuperAdmin = (user?.role as any) === 'SUPER_ADMIN';

  // Load session (we depend on JWT only right now -> activeOrgId persisted in session record if available)
  // NOTE: If multiple sessions per token pattern emerges, consider encoding activeOrgId in JWT or using a session id claim.
  const sessionToken = req.headers.get('Authorization')?.replace('Bearer ', '') || '';

  // Pull user memberships
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true }
  });

  if (isSuperAdmin) {
    // Super admin can optionally select an active organization (stored in session like normal users)
    const sessions = await prisma.session.findMany({ where: { userId } });
    const activeOrgId = sessions.find(s => s.activeOrgId)?.activeOrgId || null;
    let orgContext: OrgContext | null = null;
    if (activeOrgId) {
      const org = await prisma.organization.findUnique({ where: { id: activeOrgId } });
      if (org) {
        orgContext = {
          id: org.id,
          slug: org.slug,
          status: org.status,
          planId: org.planId,
          featureOverrides: safeParseJSON(org.featureOverrides)
        };
      }
    }
    return { needsSelection: false, memberships: [], org: orgContext, superAdmin: true };
  }

  if (memberships.length === 0) {
    return { needsSelection: false, memberships: [], org: null, superAdmin: false };
  }

  // Look for activeOrgId in any session belonging to user (simplified: find first session row for now)
  const sessions = await prisma.session.findMany({ where: { userId } });
  const activeOrgId = sessions.find(s => s.activeOrgId)?.activeOrgId || null;

  let activeMembership = activeOrgId ? memberships.find(m => m.orgId === activeOrgId) : undefined;

  if (!activeMembership) {
    if (memberships.length === 1) {
      activeMembership = memberships[0];
    } else {
      return {
        needsSelection: true,
        memberships: memberships.map(m => ({
          orgId: m.orgId,
            role: m.role,
            slug: m.organization.slug,
            name: m.organization.name,
            status: m.organization.status
        })),
        org: null,
        superAdmin: false
      };
    }
  }

  const org = activeMembership.organization;
  const orgContext: OrgContext = {
    id: org.id,
    slug: org.slug,
    status: org.status,
    planId: org.planId,
    featureOverrides: safeParseJSON(org.featureOverrides)
  };

  return {
    needsSelection: false,
    memberships: memberships.map(m => ({
      orgId: m.orgId,
      role: m.role,
      slug: m.organization.slug,
      name: m.organization.name,
      status: m.organization.status
    })),
    org: orgContext,
    superAdmin: false
  };
}

/**
 * Persist active organization selection onto a session for a user.
 * Because current auth uses JWT only, we attach to all existing sessions for the user (simple approach)
 */
export async function setActiveOrganization(userId: string, orgId: string, prisma: PrismaClient) {
  await prisma.session.updateMany({
    where: { userId },
    data: { activeOrgId: orgId }
  });
}

export function requireOrg(orgResult: Awaited<ReturnType<typeof resolveOrgContext>>): OrgContext {
  if (!orgResult.org) {
    throw Object.assign(new Error('ORGANIZATION_CONTEXT_REQUIRED'), { status: 409 });
  }
  return orgResult.org;
}

export function withOrgScope<T extends Record<string, any>>(orgId: string, where: T = {} as T) {
  return { ...where, orgId };
}

export function isSuperAdminContext(result: Awaited<ReturnType<typeof resolveOrgContext>>) {
  return (result as any).superAdmin === true;
}

export function maybeBypassOrgFilter(superAdmin: boolean, orgId?: string) {
  // If super admin and no orgId enforced, return empty filter (global query). If orgId provided, still enforce it.
  if (superAdmin && !orgId) return {};
  if (!orgId) throw new Error('OrgId required for non super admin');
  return { orgId };
}

function safeParseJSON(raw?: string | null) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}
