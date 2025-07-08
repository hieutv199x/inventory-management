//Retrieve all properties of a product that is in the DRAFT, PENDING, or ACTIVATE status.
import { NextResponse } from 'next/server';
import { generateSign } from '../../common/common';


export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const product_id = searchParams.get('product_id');

        if (!product_id) {
            return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
        }

        const appKey = process.env.TIKTOK_APP_KEY;
        const appSecret = process.env.TIKTOK_APP_SECRET;
        const token = process.env.TIKTOK_TOKEN;
        const shop_cipher = process.env.SHOP_CIPHER;

        const ts = Math.floor(new Date().getTime() / 1000);
        const urlPath = `/product/202309/products/${product_id}`;
        const baseUrl = process.env.TIKTOK_BASE_URL;


        const requestOption = {
            uri: `${baseUrl}${urlPath}`,
            qs: {
              app_key: appKey,
              timestamp: ts,
            },
            headers: {
              "content-type": "application/json",
            },
            method: "GET",
          };



        if (!appKey || !appSecret || !token || !shop_cipher || !baseUrl) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const sign = generateSign(baseUrl, urlPath, appKey, ts, appSecret, "GET");

        const url = new URL(`${baseUrl}${urlPath}`);
        url.searchParams.append("shop_cipher", shop_cipher);
        url.searchParams.append("app_key", appKey);
        url.searchParams.append("timestamp", ts.toString());
        url.searchParams.append("sign", sign);
        //no required
        url.searchParams.append("return_under_review_version", "false");

        const tiktokResponse = await fetch(url.toString(), {
            method: 'GET', // As per your original implementation
            headers: {
                'Content-Type': 'application/json',
                'x-tts-access-token': token,
            },
           
        });
       
        const data = await tiktokResponse.json();

        if (!tiktokResponse.ok) {
            // Forward the error from TikTok if the request was not successful
            console.error("TikTok API Error:", data);
            return NextResponse.json({ error: 'Failed to info shop with TikTok', details: data }, { status: tiktokResponse.status });
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