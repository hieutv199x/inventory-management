import { NextApiRequest, NextApiResponse } from "next";
import {NextResponse} from "next/server";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { method } = req;

    switch (method) {
        case "POST":
            try {
                const { code} = req.body;

                const appKey = process.env.TIKTOK_APP_KEY;
                const appSecret = process.env.TIKTOK_APP_SECRET;

                if (!appKey || !appSecret) {
                    console.error('TikTok App Key or Secret is not configured in environment variables.');
                    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
                }

                // 3. Construct the URL for the TikTok token exchange API
                const url = new URL('https://auth.tiktok-shops.com/api/v2/token/get');
                url.searchParams.append('app_key', appKey);
                url.searchParams.append('app_secret', appSecret);
                url.searchParams.append('auth_code', code);
                url.searchParams.append('grant_type', 'authorized_code');

                const tiktokResponse = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await tiktokResponse.json();

                res.status(201).json(data);
            } catch (error) {
                console.error("Error creating product:", error);
                res.status(500).json({ error: "Failed to create product" });
            }
            break;

        default:
            res.setHeader("Allow", ["POST"]);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export const config = {
    api: {
        externalResolver: true,
    },
};
