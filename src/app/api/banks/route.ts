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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search ? {
      OR: [
        {
          accountNumber: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          routingNumber: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          swiftCode: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          bankName: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          accountHolder: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      ],
    } : {};

    // Get banks with search and pagination
    const [banks, totalCount] = await Promise.all([
      prisma.bankAccount.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: {
              name: true,
            },
          },
          assignee: {
            select: {
              name: true,
            },
          },
          shop: {
            select: {
              shopName: true,
            },
          },
        },
        orderBy: {
          uploadDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.bankAccount.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Transform the data to match frontend expectations
    const transformedBanks = banks.map(bank => ({
      id: bank.id,
      accountNumber: bank.accountNumber,
      routingNumber: bank.routingNumber,
      swiftCode: bank.swiftCode,
      bankName: bank.bankName,
      accountHolder: bank.accountHolder,
      uploadDate: bank.uploadDate,
      uploader: bank.uploader.name,
      status: bank.status, // Keep as USED/UNUSED from database
      shop: bank.shop?.shopName || null,
      setupDate: bank.setupDate,
      assignedSeller: bank.assignee?.name || null,
    }));

    return NextResponse.json({
      banks: transformedBanks,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    
    // Check permissions - only ADMIN can import banks
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Only admins can import banks' },
        { status: 403 }
      );
    }

    const { banks } = await request.json();

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