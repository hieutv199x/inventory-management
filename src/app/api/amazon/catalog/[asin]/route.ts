import { catalogService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { asin: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    if (!params.asin) {
      return NextResponse.json({ 
        error: 'ASIN parameter is required' 
      }, { status: 400 });
    }

    const data = await catalogService.getCatalogItem(params.asin, marketplaceIds);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Catalog item API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
