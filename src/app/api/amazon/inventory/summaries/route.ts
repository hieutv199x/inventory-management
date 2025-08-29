import { inventoryService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const granularityType = searchParams.get('granularityType') as 'Marketplace';
    const granularityId = searchParams.get('granularityId');
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const details = searchParams.get('details') ? searchParams.get('details') === 'true' : undefined;
    const startDateTime = searchParams.get('startDateTime') || undefined;
    const sellerSkus = searchParams.get('sellerSkus')?.split(',') || undefined;
    const nextToken = searchParams.get('nextToken') || undefined;
    const maxResultsPerPage = searchParams.get('maxResultsPerPage') 
      ? parseInt(searchParams.get('maxResultsPerPage')!) 
      : undefined;

    if (!granularityType || granularityType !== 'Marketplace') {
      return NextResponse.json({ 
        error: 'granularityType parameter is required and must be "Marketplace"' 
      }, { status: 400 });
    }

    if (!granularityId) {
      return NextResponse.json({ 
        error: 'granularityId parameter is required' 
      }, { status: 400 });
    }

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    const data = await inventoryService.getInventorySummaries(
      granularityType,
      granularityId,
      marketplaceIds,
      details,
      startDateTime,
      sellerSkus,
      nextToken,
      maxResultsPerPage
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Inventory summaries API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
