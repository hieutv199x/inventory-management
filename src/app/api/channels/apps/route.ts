import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithShopAccess(request, prisma);

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    const where = channel ? { channel: channel as any } : {};
    
    const apps = await prisma.channelApp.findMany({
      where,
      include: {
        authorizations: {
          select: {
            id: true,
            shopId: true,
            shopName: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ apps });
  } catch (error) {
    console.error('Error fetching channel apps:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, isAdmin } = await getUserWithShopAccess(request, prisma);

    // Only admins can create channel apps
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { appName, channel, appId, appKey, appSecret, config } = body;

    // Validate required fields
    if (!appName || !channel || !appKey || !appSecret) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const app = await prisma.channelApp.create({
      data: {
        appName,
        channel,
        appId: appId || '',
        appKey,
        appSecret,
        config: config || null
      }
    });

    return NextResponse.json({ app });
  } catch (error) {
    console.error('Error creating channel app:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
