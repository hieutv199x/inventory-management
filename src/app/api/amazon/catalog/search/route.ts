import { catalogService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const keywords = searchParams.get('keywords') || undefined;
    const brandNames = searchParams.get('brandNames')?.split(',') || undefined;
    const classificationIds = searchParams.get('classificationIds')?.split(',') || undefined;

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    const data = await catalogService.searchCatalogItems(
      marketplaceIds,
      keywords,
      brandNames,
      classificationIds
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Catalog search API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
