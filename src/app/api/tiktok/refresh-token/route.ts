import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import {AccessTokenTool} from '@/nodejs_sdk'

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { shopId } = await req.json();

    const shop = await prisma.shopAuthorization.findFirst({
      where: { shopId: shopId },
        include:{
          app: true
        }
  });

    if (!shop) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    const appSecret = shop.app?.appSecret;

    if (!appSecret) {
        return NextResponse.json({ error: 'App secret is missing in database' }, { status: 500 });
    }

    const refresh_token = shop.refreshToken

    if (!refresh_token) {
      return NextResponse.json({ error: 'App secret is missing in database' }, { status: 500 });
  }

    const { body } = await AccessTokenTool.refreshToken(refresh_token, shop.app?.appKey, appSecret);
        console.log('getAccessToken resp data := ', JSON.stringify(body, null, 2));  
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        const data = parsedBody.data;
        if (!data?.access_token) {
          throw new Error('Failed to retrieve access token from TikTok');
      }
      await prisma.shopAuthorization.update({
          where: { id: shop.id },
          data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: (data as any).access_token_expire_in,
              scope: Array.isArray((data as any).granted_scopes) ? (data as any).granted_scopes.join(',') : (data as any).granted_scopes,
              updatedAt: new Date(),
              status: 'ACTIVE',
          },
      });


    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}