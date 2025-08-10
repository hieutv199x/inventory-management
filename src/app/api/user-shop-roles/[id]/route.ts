import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken, checkRole, checkShopPermission } from '@/lib/auth-middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { role } = await request.json();
    const { id } = params;

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    // Check if the user role exists
    const existingRole = await prisma.userShopRole.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update roles in this shop
    const isAdmin = checkRole(user!.role, ['ADMIN']);
    const hasShopPermission = await checkShopPermission(user!.id, existingRole.shopId, ['OWNER', 'RESOURCE']);

    if (!isAdmin && !hasShopPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update roles in this shop' },
        { status: 403 }
      );
    }

    // Validate role
    const validRoles = ['OWNER', 'RESOURCE', 'ACCOUNTANT', 'SELLER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: OWNER, RESOURCE, ACCOUNTANT, SELLER' },
        { status: 400 }
      );
    }

    // Prevent downgrading the last owner
    if (existingRole.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await prisma.userShopRole.count({
        where: {
          shopId: existingRole.shopId,
          role: 'OWNER'
        }
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of a shop' },
          { status: 400 }
        );
      }
    }

    const updatedUserRole = await prisma.userShopRole.update({
      where: { id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        shop: {
          select: {
            id: true,
            shopName: true
          }
        }
      }
    });

    return NextResponse.json({ userRole: updatedUserRole });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { id } = params;

    // Check if the user role exists
    const existingRole = await prisma.userShopRole.findUnique({
      where: { id }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to remove roles from this shop (Owner and Resource only, unless Admin)
    const isAdmin = checkRole(user!.role, ['ADMIN']);
    const hasShopPermission = await checkShopPermission(user!.id, existingRole.shopId, ['OWNER', 'RESOURCE']);

    if (!isAdmin && !hasShopPermission) {
      return NextResponse.json(
        { error: 'Only shop owners, resource managers, or administrators can remove users from shops' },
        { status: 403 }
      );
    }

    // Prevent removing the last owner
    if (existingRole.role === 'OWNER') {
      const ownerCount = await prisma.userShopRole.count({
        where: {
          shopId: existingRole.shopId,
          role: 'OWNER'
        }
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of a shop' },
          { status: 400 }
        );
      }
    }

    await prisma.userShopRole.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'User role deleted successfully' });
  } catch (error) {
    console.error('Error deleting user role:', error);
    return NextResponse.json(
      { error: 'Failed to delete user role' },
      { status: 500 }
    );
  }
}
