import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import {AccessTokenTool} from '@/nodejs_sdk'

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { app_key } = await req.json();

    const credential = await prisma.tikTokAppCredential.findFirst({
      where: { appKey: app_key },
  });

    if (!credential) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    const appSecret = credential.appSecret;

    if (!appSecret) {
        return NextResponse.json({ error: 'App secret is missing in database' }, { status: 500 });
    }
    const refresh_token = credential.refreshToken

    if (!refresh_token) {
      return NextResponse.json({ error: 'App secret is missing in database' }, { status: 500 });
  }

    const { body } = await AccessTokenTool.refreshToken(refresh_token, app_key, appSecret);  
        console.log('getAccessToken resp data := ', JSON.stringify(body, null, 2));  
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        const data = parsedBody.data;
        if (!data?.access_token) {
          throw new Error('Failed to retrieve access token from TikTok');
      }
      await prisma.tikTokAppCredential.update({
          where: { id: credential.id },
          data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: (data as any).access_token_expire_in,
              scope: Array.isArray((data as any).granted_scopes) ? (data as any).granted_scopes.join(',') : (data as any).granted_scopes,
              updatedAt: new Date(),
              status: 'active',
          },
      });


    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}