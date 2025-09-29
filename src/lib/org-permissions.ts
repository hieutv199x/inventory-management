import { PrismaClient, OrganizationRole } from '@prisma/client';

// Super admin user-level role constant
export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export interface OrgMembershipCheck {
  orgId: string;
  role: OrganizationRole;
}

export async function getActiveMembership(prisma: PrismaClient, userId: string, orgId: string) {
  return prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } }
  });
}

export function assertOrgRole(membership: { role: OrganizationRole } | null | undefined, allowed: OrganizationRole[]) {
  if (!membership || !allowed.includes(membership.role)) {
    const err: any = new Error('FORBIDDEN_ORG_ROLE');
    err.status = 403;
    throw err;
  }
}

export function canManageMembers(role: OrganizationRole | string) {
  if (role === SUPER_ADMIN_ROLE) return true;
  return ['OWNER', 'ADMIN'].includes(role as OrganizationRole);
}

export function canChangeRole(currentRole: OrganizationRole | string, targetRole: OrganizationRole) {
  if (currentRole === SUPER_ADMIN_ROLE) return true;
  if (currentRole === 'OWNER') return true; // full
  if (currentRole === 'ADMIN') return targetRole !== 'OWNER';
  return false;
}

export function canRemoveMember(currentRole: OrganizationRole | string, targetRole: OrganizationRole) {
  if (currentRole === SUPER_ADMIN_ROLE) return true;
  if (currentRole === 'OWNER') return true;
  if (currentRole === 'ADMIN') return targetRole !== 'OWNER';
  return false;
}
