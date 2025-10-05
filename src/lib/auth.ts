import { NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { Prisma, PrismaClient } from "@prisma/client";
import { resolveOrgContext } from "./tenant-context";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const verifyToken = (request: NextRequest) => {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        const error = new Error('Authentication required') as any;
        error.status = 401;
        throw error;
    }

    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            const error = new Error('Token expired') as any;
            error.status = 403;
            throw error;
        } else if (err instanceof jwt.JsonWebTokenError) {
            const error = new Error('Invalid token') as any;
            error.status = 401;
            throw error;
        } else {
            const error = new Error('Token verification failed') as any;
            error.status = 401;
            throw error;
        }
    }
};

export const getUserWithShopAccess = async (
    request: NextRequest,
    prisma: PrismaClient,
    includeShopIds: boolean = false
) => {
    const decoded = verifyToken(request);
    const orgContext = await resolveOrgContext(request, prisma);

    // Get current user
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
            userShopRoles: {
                include: {
                    shop: {
                        select: {
                            id: true,
                            shopId: true,
                        }
                    }
                }
            },
            organizationMemberships: true,
            groupMemberships: {
                where: { isActive: true },
                include: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            orgId: true,
                        }
                    }
                }
            }
        }
    });

    if (!currentUser) {
        throw new Error('User not found');
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role as string);
    const activeOrgId = orgContext.org?.id ?? null;

    if (isAdmin && includeShopIds) {
        // Admin has access to all shops
        const allShops = await prisma.shopAuthorization.findMany({
            where: { status: 'ACTIVE', orgId: orgContext.org?.id },
            select: { id: true }
        });
        const allShopIds = allShops.map(shop => shop.id);
        return {
            user: currentUser,
            accessibleShopIds: allShopIds,
            directShopIds: allShopIds,
            managedGroupShopIds: [],
            managedGroupIds: [],
            isAdmin: true,
            isManager: false,
            activeOrgId
        };
    }

    // Get accessible shop IDs (now using the unified shopId field)
    const directShopIds = Array.from(new Set(
        (currentUser.userShopRoles ?? [])
            .map((userRole) => userRole.shop?.id)
            .filter((shopId): shopId is string => Boolean(shopId))
    ));

    const managedGroupIds = (currentUser.groupMemberships ?? [])
        .filter((membership) => membership.role === 'MANAGER' && membership.group)
        .map((membership) => membership.groupId);

    let managedGroupShopIds: string[] = [];

    if (managedGroupIds.length > 0) {
        const groupScopedShops = await prisma.shopAuthorization.findMany({
            where: {
                status: 'ACTIVE',
                groupId: { in: managedGroupIds },
                ...(orgContext.org?.id ? { orgId: orgContext.org.id } : {})
            },
            select: { id: true }
        });

        managedGroupShopIds = Array.from(new Set(groupScopedShops.map((shop) => shop.id)));
    }

    const accessibleShopIds = Array.from(new Set([
        ...directShopIds,
        ...managedGroupShopIds
    ]));

    return {
        user: currentUser,
        accessibleShopIds,
        directShopIds,
        managedGroupShopIds,
        managedGroupIds,
        isAdmin,
        isManager: managedGroupIds.length > 0,
        activeOrgId
    };
};

type ActiveShopScope = {
    orgId?: string | null;
    groupIds?: string[];
    shopIds?: string[];
};

export const getActiveShopIds = async (
    prisma: PrismaClient,
    scope: ActiveShopScope = {}
): Promise<string[]> => {
    const { orgId, groupIds, shopIds } = scope;

    const where: Prisma.ShopAuthorizationWhereInput = {
        status: 'ACTIVE',
        ...(orgId ? { orgId } : {}),
    };

    const scopedClauses: Prisma.ShopAuthorizationWhereInput[] = [];

    if (groupIds?.length) {
        scopedClauses.push({ groupId: { in: groupIds } });
    }

    if (shopIds?.length) {
        scopedClauses.push({ id: { in: shopIds } });
    }

    if (scopedClauses.length > 0) {
        where.AND = { OR: scopedClauses };
    }

    const activeShops = await prisma.shopAuthorization.findMany({
        where,
        select: { id: true },
    });

    return activeShops.map(shop => shop.id);
};

export const validateShopAccess = (
    requestedShopId: string | null,
    isAdmin: boolean,
    accessibleShopIds: string[],
    activeShopIds: string[]
): { shopFilter: any; hasAccess: boolean } => {
    if (isAdmin) {
        // Administrators can access all active shops
        if (requestedShopId) {
            if (activeShopIds.includes(requestedShopId)) {
                return { shopFilter: requestedShopId, hasAccess: true };
            } else {
                return { shopFilter: null, hasAccess: false };
            }
        } else {
            return { shopFilter: { in: activeShopIds }, hasAccess: true };
        }
    } else {
        // Non-admin users are restricted to their accessible shops
        const validShopIds = accessibleShopIds.filter(id => activeShopIds.includes(id));
        
        if (validShopIds.length === 0) {
            return { shopFilter: null, hasAccess: false };
        }

        if (requestedShopId) {
            if (validShopIds.includes(requestedShopId)) {
                return { shopFilter: requestedShopId, hasAccess: true };
            } else {
                return { shopFilter: null, hasAccess: false };
            }
        } else {
            return { shopFilter: { in: validShopIds }, hasAccess: true };
        }
    }
};
