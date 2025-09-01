import { NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const verifyToken = (request: NextRequest) => {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        throw new Error('Authentication required');
    }

    return jwt.verify(token, JWT_SECRET) as any;
};

export const getUserWithShopAccess = async (request: NextRequest, prisma: PrismaClient) => {
    const decoded = verifyToken(request);

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
            }
        }
    });

    if (!currentUser) {
        throw new Error('User not found');
    }

    // Get accessible shop IDs (now using the unified shopId field)
    const accessibleShopIds = currentUser.userShopRoles
        .map(role => role.shop?.shopId)
        .filter(Boolean) as string[];

    return {
        user: currentUser,
        accessibleShopIds,
        isAdmin: ['ADMIN', 'MANAGER'].includes(currentUser.role)
    };
};

export const getActiveShopIds = async (prisma: PrismaClient): Promise<string[]> => {
    const activeShops = await prisma.shopAuthorization.findMany({
        where: { status: 'ACTIVE' },
        select: { shopId: true },
    });
    return activeShops.map(shop => shop.shopId);
};

export const validateShopAccess = (
    requestedShopId: string | null,
    isAdmin: boolean,
    accessibleShopIds: string[],
    activeShopIds: string[]
): { shopFilter: any; hasAccess: boolean } => {
    if (isAdmin) {
        // Admin/Manager can access all active shops
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
