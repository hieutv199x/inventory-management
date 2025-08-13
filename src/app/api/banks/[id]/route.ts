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
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request);
    
    // Only ADMIN can delete banks
    // if (decoded.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { message: 'Only admins can delete banks' },
    //     { status: 403 }
    //   );
    // }
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
    const bank = await prisma.bankAccount.findUnique({
      where: { id: params.id }
    });

    if (!bank) {
      return NextResponse.json(
        { message: 'Bank not found' },
        { status: 404 }
      );
    }

    // Delete bank account
    await prisma.bankAccount.delete({
      where: { id: params.id }
    });

    // Log history
    await prisma.bankHistory.create({
      data: {
        action: 'Delete bank',
        details: `Deleted bank account ${bank.accountNumber}`,
        userId: decoded.userId
      }
    });

    return NextResponse.json({ message: 'Bank deleted successfully' });

  } catch (error) {
    console.error('Delete bank error:', error);
    return NextResponse.json(
      { message: 'Failed to delete bank' },
      { status: 500 }
    );
  }
}
