import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { country, serviceId, appName, appKey, appSecret } = body;

    if (!country || !serviceId || !appName || !appKey || !appSecret) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
        // Kiểm tra trùng appKey
        const result = await prisma.tikTokApp.upsert({
            where: { appKey: appKey },
            update: {
              appId: serviceId,
              appName,
              appKey,
              appSecret,
              updatedAt: new Date(),
            },
            create: {
              appId: serviceId,
              appName,
              appKey,
              appSecret,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

    return NextResponse.json(
      { message: 'Shop saved successfully', data: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Failed to save shop:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}