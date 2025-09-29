import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyToken(request);
    const { id } = await params;
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);
    
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
        orgId: org.id,
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
        bankId: updatedBank.id,
        orgId: org.id
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
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
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
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Failed to delete shop' },
      { status: 500 }
    );
  }
}