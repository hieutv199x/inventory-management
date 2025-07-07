import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // In the App Router, we get the JSON body directly from the request object.
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
        }

        const appKey = process.env.TIKTOK_APP_KEY;
        const appSecret = process.env.TIKTOK_APP_SECRET;

        if (!appKey || !appSecret) {
            console.error('TikTok App Key or Secret is not configured in environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Construct the URL for the TikTok token exchange API
        const url = new URL('https://auth.tiktok-shops.com/api/v2/token/get');
        url.searchParams.append('app_key', appKey);
        url.searchParams.append('app_secret', appSecret);
        url.searchParams.append('auth_code', code as string);
        url.searchParams.append('grant_type', 'authorized_code');

        const tiktokResponse = await fetch(url.toString(), {
            method: 'GET', // As per your original implementation
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await tiktokResponse.json();

        if (!tiktokResponse.ok) {
            // Forward the error from TikTok if the request was not successful
            console.error("TikTok API Error:", data);
            return NextResponse.json({ error: 'Failed to exchange token with TikTok', details: data }, { status: tiktokResponse.status });
        }

        // Use 200 (OK) for a successful response that returns data, rather than 201 (Created).
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Error exchanging TikTok token:", error);
        // Handle cases where the request body is not valid JSON
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}