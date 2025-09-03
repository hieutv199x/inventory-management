import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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
    
    // Find app by ID in ChannelApp
    const app = await prisma.channelApp.findUnique({
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
    const updatedApp = await prisma.channelApp.update({
      where: { id: params.id },
      data: { appSecret }
    });

    return NextResponse.json(updatedApp);

  } catch (error) {
    console.error('app:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
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

    // Get the app before deletion for history
    const app = await prisma.channelApp.findUnique({
      where: { id: params.id }
    });

    if (!app) {
      return NextResponse.json(
        { message: 'App not found' },
        { status: 404 }
      );
    }

    // Deactivate app
    await prisma.channelApp.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    // Deactivate all associated shop authorizations
    await prisma.shopAuthorization.updateMany({
      where: { appId: params.id },
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({ message: 'App deleted successfully' });

  } catch (error) {
    console.error('Delete bank error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Failed to delete bank' },
      { status: 500 }
    );
  }
}
