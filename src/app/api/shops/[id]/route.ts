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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyToken(request);
    const { id } = await params;
    
    // Only ADMIN and ACCOUNTANT can assign shops
    // if (!['ADMIN', 'ACCOUNTANT'].includes(decoded.role)) {
    //   return NextResponse.json(
    //     { message: 'Insufficient permissions' },
    //     { status: 403 }
    //   );
    // }

    const { shopId } = await request.json();
    
    // Find shop by name in ShopAuthorization
    const shop = await prisma.shopAuthorization.findFirst({
      where: {
        shopId: shopId,
        status: 'ACTIVE'
      }
    });

    if (!shop) {
      return NextResponse.json(
        { message: 'Shop not found or inactive' },
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

    if (!['ADMIN', 'ACCOUNTANT'].includes(user.role)) {
      return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
      );
    }

    // Update bank account
    const updatedBank = await prisma.bankAccount.update({
      where: { id },
      data: {
        shopId: shop.id,
        assigneeId: user.id,
        status: 'USED',
        setupDate: new Date()
      },
      include: {
        uploader: { select: { name: true } },
        assignee: { select: { name: true } },
        shop: { select: { shopName: true } }
      }
    });

    // Log history
    await prisma.bankHistory.create({
      data: {
        action: 'Assign shop',
        details: `Assigned ${updatedBank.shop?.shopName} to account ${updatedBank.accountNumber}`,
        userId: user.id,
        bankId: updatedBank.id
      }
    });

    const formattedBank = {
      id: updatedBank.id,
      accountNumber: updatedBank.accountNumber,
      routingNumber: updatedBank.routingNumber,
      swiftCode: updatedBank.swiftCode,
      bankName: updatedBank.bankName,
      accountHolder: updatedBank.accountHolder,
      uploadDate: updatedBank.uploadDate.toISOString(),
      uploader: updatedBank.uploader.name,
      status: updatedBank.status.toLowerCase(),
      shop: updatedBank.shop?.shopName || null,
      setupDate: updatedBank.setupDate?.toISOString() || null,
      assignedSeller: updatedBank.assignee?.name || null
    };

    return NextResponse.json(formattedBank);

  } catch (error) {
    console.error('Assign bank error:', error);
    return NextResponse.json(
      { message: 'Failed to assign bank' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyToken(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
          { message: 'User not found' },
          { status: 400 }
      );
    }

    if (!['ADMIN'].includes(user.role)) {
      return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
      );
    }

    const shop = await prisma.shopAuthorization.findUnique({
      where: { id }
    });

    if (!shop) {
      return NextResponse.json(
        { message: 'Shop not found' },
        { status: 404 }
      );
    }

    await prisma.shopAuthorization.update({
      where: { id },
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({ message: 'Shop deleted successfully' });

  } catch (error) {
    console.error('Delete shop error:', error);
    return NextResponse.json(
      { message: 'Failed to delete shop' },
      { status: 500 }
    );
  }
}
