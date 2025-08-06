import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    jwt.verify(token, JWT_SECRET) as any;
    
    // Get history from database
    const history = await prisma.bankHistory.findMany({
      include: {
        user: {
          select: { name: true, role: true }
        },
        bank: {
          select: { accountNumber: true }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    const formattedHistory = history.map(item => ({
      id: item.id,
      action: item.action,
      user: item.user.name,
      userRole: item.user.role,
      timestamp: item.timestamp.toISOString(),
      details: item.details
    }));

    return NextResponse.json(formattedHistory);

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }
}
