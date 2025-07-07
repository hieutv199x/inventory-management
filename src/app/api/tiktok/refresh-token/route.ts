import { NextResponse } from "next/server";

export async function GET() {
  try {

    const appKey = process.env.TIKTOK_APP_KEY;
    const appSecret = process.env.TIKTOK_APP_SECRET;
    const refresh_token = process.env.TIKTOK_REFRESH_TOKEN;

    if (!appKey || !appSecret || !refresh_token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // TikTok refresh token endpoint (ví dụ, bạn cần thay đúng endpoint docs của TikTok Shop)
    const url = "https://auth.tiktok-shops.com/api/v2/token/refresh";

    const body = {
      app_key: appKey,
      app_secret: appSecret,
      grant_type: "refresh_token",
      refresh_token,
    };

    const tiktokRes = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await tiktokRes.json();

    if (!tiktokRes.ok) {
      return NextResponse.json({ error: "Failed to refresh token", details: data }, { status: tiktokRes.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}