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

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    
    // Check permissions - only ADMIN and ACCOUNTANT can view banks
    if (!['ADMIN', 'ACCOUNTANT'].includes(decoded.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const banks = await prisma.bankAccount.findMany({
      include: {
        uploader: {
          select: { name: true, email: true }
        },
        assignee: {
          select: { name: true, email: true }
        },
        shop: {
          select: { shopName: true }
        }
      },
      orderBy: {
        uploadDate: 'desc'
      }
    });

    const formattedBanks = banks.map(bank => ({
      id: bank.id,
      accountNumber: bank.accountNumber,
      routingNumber: bank.routingNumber,
      swiftCode: bank.swiftCode,
      bankName: bank.bankName,
      accountHolder: bank.accountHolder,
      uploadDate: bank.uploadDate.toISOString(),
      uploader: bank.uploader.name,
      status: bank.status.toLowerCase(),
      shop: bank.shop?.shopName || null,
      setupDate: bank.setupDate?.toISOString() || null,
      assignedSeller: bank.assignee?.name || null
    }));

    return NextResponse.json(formattedBanks);

  } catch (error) {
    console.error('Get banks error:', error);
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    
    // Only ADMIN can import banks
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only admins can import banks' },
        { status: 403 }
      );
    }

    const { banks } = await request.json();
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Create bank accounts in database
    const createdBanks = await Promise.all(
      banks.map(async (bank: any) => {
        const createdBank = await prisma.bankAccount.create({
          data: {
            accountNumber: bank.accountNumber,
            routingNumber: bank.routingNumber,
            swiftCode: bank.swiftCode,
            bankName: bank.bankName,
            accountHolder: bank.accountHolder,
            uploaderId: user.id,
            status: 'UNUSED'
          },
          include: {
            uploader: {
              select: { name: true }
            }
          }
        });

        // Log history
        await prisma.bankHistory.create({
          data: {
            action: 'Import bank',
            details: `Imported bank account ${bank.accountNumber}`,
            userId: user.id,
            bankId: createdBank.id
          }
        });

        return createdBank;
      })
    );

    // Log bulk import history
    await prisma.bankHistory.create({
      data: {
        action: 'Import bank',
        details: `Imported ${banks.length} bank accounts from CSV file`,
        userId: user.id
      }
    });

    const formattedBanks = createdBanks.map(bank => ({
      id: bank.id,
      accountNumber: bank.accountNumber,
      routingNumber: bank.routingNumber,
      swiftCode: bank.swiftCode,
      bankName: bank.bankName,
      accountHolder: bank.accountHolder,
      uploadDate: bank.uploadDate.toISOString(),
      uploader: bank.uploader.name,
      status: bank.status.toLowerCase(),
      shop: null,
      setupDate: null,
      assignedSeller: null
    }));

    return NextResponse.json(formattedBanks);

  } catch (error) {
    console.error('Import banks error:', error);
    return NextResponse.json(
      { message: 'Failed to import banks' },
      { status: 500 }
    );
  }
}
