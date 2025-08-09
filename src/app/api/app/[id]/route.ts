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
    
    // Only ADMIN and ACCOUNTANT can assign shops
    // if (!['ADMIN', 'ACCOUNTANT'].includes(decoded.role)) {
    //   return NextResponse.json(
    //     { message: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    const { appSecret } = await request.json();
    
    // Find shop by name in ShopAuthorization
    const app = await prisma.tikTokApp.findUnique({
      where: { id: params.id }
    });


    if (!app) {
      return NextResponse.json(
        { message: 'app not found or inactive' },
        { status: 404 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
      );
    }
    const updatedApp = await prisma.tikTokApp.update({
      where: { id: params.id },
      data: { appSecret }
    });

    return NextResponse.json(updatedApp);

  } catch (error) {
    console.error('app:', error);
    return NextResponse.json(
      { message: 'Failed to app' },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request);
    

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
      );
    }

    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
      );
    }

    // Get the bank before deletion for history
    const app = await prisma.tikTokApp.findUnique({
      where: { id: params.id }
    });

    if (!app) {
      return NextResponse.json(
        { message: 'App not found' },
        { status: 404 }
      );
    }

    // Delete bank account
    await prisma.tikTokApp.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    await prisma.shopAuthorization.updateMany({
      where: { appId: params.id },
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({ message: 'App deleted successfully' });

  } catch (error) {
    console.error('Delete bank error:', error);
    return NextResponse.json(
      { message: 'Failed to delete bank' },
      { status: 500 }
    );
  }
}
