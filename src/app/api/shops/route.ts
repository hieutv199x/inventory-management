import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken, checkRole } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    // Check if user has permission
    if (!checkRole(user!.role, ['ADMIN', 'MANAGER'])) {
      // If not admin/manager, only show shops they have access to
      const userShops = await prisma.shopAuthorization.findMany({
        where: {
          userShopRoles: {
            some: {
              userId: user!.id
            }
          }
        },
        select: {
          id: true,
          shopName: true
        },
        orderBy: {
          shopName: 'asc'
        }
      });

      return NextResponse.json({ shops: userShops });
    }

    // Admin/Manager can see all shops
    const shops = await prisma.shopAuthorization.findMany({
      select: {
        id: true,
        shopName: true
      },
      orderBy: {
        shopName: 'asc'
      }
    });

    return NextResponse.json({ shops });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}
