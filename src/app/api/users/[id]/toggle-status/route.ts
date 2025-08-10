import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const verifyToken = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  return jwt.verify(token, JWT_SECRET) as any;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request);
    
    // Check if user exists and has permission
    const requestingUser = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!requestingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Only ADMIN and MANAGER can toggle user status
    if (!['ADMIN', 'MANAGER'].includes(requestingUser.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { isActive } = await request.json();
    const userId = params.id;

    // Prevent users from deactivating themselves
    if (userId === requestingUser.id && !isActive) {
      return NextResponse.json(
        { message: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });

    return NextResponse.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    return NextResponse.json(
      { message: 'Failed to toggle user status' },
      { status: 500 }
    );
  }
}
