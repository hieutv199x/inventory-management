import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrganizationRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { resolveOrgContext } from '@/lib/tenant-context';

// Get all users (Admin and Manager only)
export async function GET(request: NextRequest) {
  try {
    // Resolve organization context (also authenticates)
    const orgResult = await resolveOrgContext(request, prisma as any);

    // Super admin must still have an active organization selected to view scoped users
    if (orgResult.superAdmin && !orgResult.org) {
      return NextResponse.json({ error: 'ACTIVE_ORG_REQUIRED' }, { status: 409 });
    }

    if (!orgResult.org) {
      return NextResponse.json({ error: 'ORGANIZATION_CONTEXT_REQUIRED' }, { status: 409 });
    }

    // Check membership role (only OWNER / ADMIN of the active org can list users)
    if (!orgResult.superAdmin) {
      const activeMembership = orgResult.memberships.find(m => m.orgId === orgResult.org!.id);
      if (!activeMembership || !['OWNER', 'ADMIN'].includes(activeMembership.role)) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
      }
    }

  const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build membership-scoped where clause referencing user fields
    const membershipWhere: any = { orgId: orgResult.org.id };
    if (search) {
      membershipWhere.user = {
        ...(membershipWhere.user || {}),
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ]
      };
    }
    if (role) {
      membershipWhere.user = {
        ...(membershipWhere.user || {}),
        role
      };
    }

    // Query organization members with included user data
    const memberships = await prisma.organizationMember.findMany({
      where: membershipWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            createdBy: true,
            creator: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }, // membership creation time
      skip,
      take: limit
    });

    const totalCount = await prisma.organizationMember.count({ where: membershipWhere });
    const totalPages = Math.ceil(totalCount / limit);

    // Extract users and then load shop roles (keeping previous behavior)
    const activeOrgId = orgResult.org.id;

    const baseUsers = memberships.map(m => ({ ...m.user, organizationRole: m.role }));

    const usersWithShopRoles = await Promise.all(
      baseUsers.map(async (user) => {
        try {
          const [userShopRoles, groupMemberships] = await Promise.all([
            prisma.userShopRole.findMany({
              where: { userId: user.id },
              select: { id: true, role: true, shopId: true }
            }),
            prisma.shopGroupMember.findMany({
              where: { userId: user.id, isActive: true },
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    orgId: true,
                    managerId: true,
                    shops: {
                      select: {
                        id: true,
                        shopId: true,
                        shopName: true,
                        status: true
                      }
                    }
                  }
                }
              }
            })
          ]);

          const rolesWithShops = await Promise.all(
            userShopRoles.map(async (usrRole) => {
              try {
                const shop = await prisma.shopAuthorization.findUnique({
                  where: { id: usrRole.shopId },
                  select: {
                    id: true,
                    shopId: true,
                    shopName: true,
                    status: true,
                    app: { select: { channel: true, appName: true } }
                  }
                });
                return {
                  id: usrRole.id,
                  role: usrRole.role,
                  shop: shop ? {
                    ...shop,
                    channelName: shop.app?.channel || 'UNKNOWN',
                    appName: shop.app?.appName || 'Unknown App'
                  } : null
                };
              } catch (e) {
                console.warn(`Could not fetch shop for role ${usrRole.id}:`, e);
                return { id: usrRole.id, role: usrRole.role, shop: null };
              }
            })
          );

          const validRoles = rolesWithShops
            .filter(r => r.shop !== null)
            .map((r) => ({
              id: r.id,
              role: r.role,
              shopAuthorizationId: r.shop!.id,
              shopId: r.shop!.shopId,
              shopName: r.shop!.shopName,
              status: r.shop!.status,
              channelName: r.shop!.channelName,
              appName: r.shop!.appName
            }));

          const activeGroupMemberships = groupMemberships.filter(
            (membership) => membership.group && membership.group.orgId === activeOrgId
          );

          const groups = activeGroupMemberships.map((membership) => ({
            id: membership.group!.id,
            name: membership.group!.name,
            role: membership.role,
            isDefault: membership.isDefault
          }));

          const accessibleShopMap = new Map<string, {
            shopAuthorizationId: string;
            shopId: string | null;
            shopName: string | null;
            status: string | null;
            viaDirectRoles: string[];
            viaGroups: { id: string; name: string }[];
          }>();

          validRoles.forEach((roleAssignment) => {
            const key = roleAssignment.shopAuthorizationId;
            if (!key) {
              return;
            }
            const existing = accessibleShopMap.get(key) ?? {
              shopAuthorizationId: roleAssignment.shopAuthorizationId,
              shopId: roleAssignment.shopId,
              shopName: roleAssignment.shopName,
              status: roleAssignment.status,
              viaDirectRoles: [],
              viaGroups: []
            };
            existing.viaDirectRoles = Array.from(new Set([...existing.viaDirectRoles, roleAssignment.role]));
            accessibleShopMap.set(key, existing);
          });

          activeGroupMemberships.forEach((membership) => {
            if (!membership.group) {
              return;
            }
            membership.group.shops
              .filter((shop) => shop.status === 'ACTIVE')
              .forEach((shop) => {
                const existing = accessibleShopMap.get(shop.id) ?? {
                  shopAuthorizationId: shop.id,
                  shopId: shop.shopId,
                  shopName: shop.shopName,
                  status: shop.status,
                  viaDirectRoles: [],
                  viaGroups: []
                };
                const alreadyAdded = existing.viaGroups.some((group) => group.id === membership.group!.id);
                if (!alreadyAdded) {
                  existing.viaGroups.push({ id: membership.group.id, name: membership.group.name });
                }
                accessibleShopMap.set(shop.id, existing);
              });
          });

          const accessibleShops = Array.from(accessibleShopMap.values()).map((shop) => ({
            ...shop,
            viaDirectRoles: Array.from(new Set(shop.viaDirectRoles)),
            viaGroups: shop.viaGroups
          }));

          return {
            ...user,
            userShopRoles: validRoles,
            groups,
            accessibleShops
          };
        } catch (e) {
          console.warn(`Could not fetch shop roles for user ${user.id}:`, e);
          return { ...user, userShopRoles: [], groups: [], accessibleShops: [] };
        }
      })
    );

    return NextResponse.json({
      users: usersWithShopRoles,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users (org scoped):', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
  const decoded = verifyToken(request);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Determine org context and creator permissions
    const orgContext = await resolveOrgContext(request, prisma as any);
    const isSuperAdmin = orgContext.superAdmin === true || currentUser.role === "SUPER_ADMIN";

    // Check if user has permission
    if (!(["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(currentUser.role))) {
      return NextResponse.json(
        { error: "Only administrators can create users" },
        { status: 403 }
      );
    }

    let targetOrgId: string | null = null;
    if (!isSuperAdmin) {
      if (!orgContext.org) {
        const errorCode = orgContext.needsSelection ? "ACTIVE_ORG_REQUIRED" : "ORGANIZATION_CONTEXT_REQUIRED";
        return NextResponse.json({ error: errorCode }, { status: 409 });
      }

      targetOrgId = orgContext.org.id;

      const activeMembership = orgContext.memberships?.find((membership) => membership.orgId === targetOrgId);
      if (!activeMembership) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    }

    const { name, username, role, password } = await request.json();

    if (!name || !username || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super administrators can create super admin users" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const mapUserRoleToOrgRole = (userRole: string): OrganizationRole => {
      switch (userRole) {
        case "ADMIN":
        case "MANAGER":
          return OrganizationRole.ADMIN;
        case "ACCOUNTANT":
          return OrganizationRole.ACCOUNTANT;
        case "RESOURCE":
        case "SELLER":
          return OrganizationRole.OPERATOR;
        case "SUPER_ADMIN":
          return OrganizationRole.ADMIN;
        default:
          return OrganizationRole.VIEWER;
      }
    };

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          username,
          role,
          password: hashedPassword,
          createdBy: currentUser.id,
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
      });

      if (targetOrgId) {
        await tx.organizationMember.create({
          data: {
            orgId: targetOrgId,
            userId: createdUser.id,
            role: mapUserRoleToOrgRole(createdUser.role),
            inviteStatus: "ACCEPTED",
          },
        });
      }

      return createdUser;
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}