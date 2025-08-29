import { getMarketplaceParticipations } from '@/lib/amazonSpApi';
import { NextResponse } from 'next/server';

// Force this API route to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log("Starting marketplace API call");
    const data = await getMarketplaceParticipations();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Marketplace API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}