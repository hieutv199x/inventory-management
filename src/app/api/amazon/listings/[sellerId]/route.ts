import { listingsService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const includedData = searchParams.get('includedData')?.split(',') as Array<'summaries' | 'attributes' | 'issues' | 'offers' | 'fulfillmentAvailability' | 'procurement' | 'relationships' | 'productTypes'> || undefined;
    const identifiers = searchParams.get('identifiers')?.split(',') || undefined;
    const identifiersType = searchParams.get('identifiersType') as 'ASIN' | 'EAN' | 'FNSKU' | 'GTIN' | 'ISBN' | 'JAN' | 'MINSAN' | 'SKU' | 'UPC' || undefined;
    const variationParentSku = searchParams.get('variationParentSku') || undefined;
    const packageHierarchySku = searchParams.get('packageHierarchySku') || undefined;
    const createdAfter = searchParams.get('createdAfter') || undefined;
    const createdBefore = searchParams.get('createdBefore') || undefined;
    const lastUpdatedAfter = searchParams.get('lastUpdatedAfter') || undefined;
    const lastUpdatedBefore = searchParams.get('lastUpdatedBefore') || undefined;
    const withIssueSeverity = searchParams.get('withIssueSeverity')?.split(',') as Array<'WARNING' | 'ERROR'> || undefined;
    const withStatus = searchParams.get('withStatus')?.split(',') as Array<'BUYABLE' | 'DISCOVERABLE'> || undefined;
    const withoutStatus = searchParams.get('withoutStatus')?.split(',') as Array<'BUYABLE' | 'DISCOVERABLE'> || undefined;
    const sortBy = searchParams.get('sortBy') as 'sku' | 'createdDate' | 'lastUpdatedDate' || undefined;
    const sortOrder = searchParams.get('sortOrder') as 'ASC' | 'DESC' || undefined;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined;
    const pageToken = searchParams.get('pageToken') || undefined;
    const issueLocale = searchParams.get('issueLocale') || undefined;

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    if (!params.sellerId) {
      return NextResponse.json({ 
        error: 'sellerId parameter is required' 
      }, { status: 400 });
    }

    if (pageSize && (pageSize < 1 || pageSize > 20)) {
      return NextResponse.json({ 
        error: 'pageSize must be between 1 and 20' 
      }, { status: 400 });
    }

    const data = await listingsService.searchListingsItems(
      params.sellerId,
      marketplaceIds,
      includedData,
      identifiers,
      identifiersType,
      variationParentSku,
      packageHierarchySku,
      createdAfter,
      createdBefore,
      lastUpdatedAfter,
      lastUpdatedBefore,
      withIssueSeverity,
      withStatus,
      withoutStatus,
      sortBy,
      sortOrder,
      pageSize,
      pageToken,
      issueLocale
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search listings items API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
