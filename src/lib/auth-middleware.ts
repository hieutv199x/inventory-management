import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function validateToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 };
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      return { error: 'JWT secret not configured', status: 500 };
    }

    const decoded = verify(token, process.env.JWT_SECRET) as DecodedToken;
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return { error: 'User not found or inactive', status: 401 };
    }

    return { user, error: null };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return { error: 'Token expired', status: 401 };
      }
      if (error.name === 'JsonWebTokenError') {
        return { error: 'Invalid token', status: 401 };
      }
    }
    return { error: 'Authentication failed', status: 401 };
  }
}

export function checkRole(userRole: string, allowedRoles: string[]) {
  return allowedRoles.includes(userRole);
}

export async function checkShopPermission(userId: string, shopId: string, allowedRoles: string[]) {
  try {
    const userShopRole = await prisma.userShopRole.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId
        }
      }
    });

    if (!userShopRole) {
      return false;
    }

    return allowedRoles.includes(userShopRole.role);
  } catch (error) {
    return false;
  }
}
