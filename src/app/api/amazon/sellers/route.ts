import { sellersService } from '@/lib/amazon-sp-api';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log("Getting marketplace participations");
    const data = await sellersService.getMarketplaceParticipations();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sellers API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
