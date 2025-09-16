import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { AccessTokenTool } from '@/nodejs_sdk';

const prisma = new PrismaClient();

/**
 * Refresh TikTok access token
 *
 * Curl examples:
 * 1) Using GET with query param (current implementation)
 *    curl -X GET "https://your-domain.com/api/tiktok/refresh-token?shopId=YOUR_SHOP_ID"
 *
 * 2) Local dev (default Next.js port 3000):
 *    curl -X GET "http://localhost:3000/api/tiktok/refresh-token?shopId=YOUR_SHOP_ID"
 *
 * Successful response: JSON containing new access/refresh tokens.
 * Error response: { "error": "..." }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const shop = await prisma.shopAuthorization.findFirst({
      where: { shopId },
      include: { app: true }
    });

    if (!shop || !shop.app?.appSecret || !shop.app?.appKey) {
      return NextResponse.json({ error: "Shop or app credentials not found" }, { status: 400 });
    }

    const refresh_token = shop.refreshToken;
    if (!refresh_token) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    const { body } = await AccessTokenTool.refreshToken(refresh_token, shop.app.appKey, shop.app.appSecret);
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    const data = parsedBody.data;

    if (!data?.access_token) {
      return NextResponse.json({ error: "Failed to retrieve access token from TikTok" }, { status: 502 });
    }

    await prisma.shopAuthorization.update({
      where: { id: shop.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: (data as any).access_token_expire_in,
        scope: Array.isArray((data as any).granted_scopes)
          ? (data as any).granted_scopes.join(',')
          : (data as any).granted_scopes,
        updatedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}