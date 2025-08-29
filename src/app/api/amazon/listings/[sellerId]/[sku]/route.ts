import { listingsService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string; sku: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const includedData = searchParams.get('includedData')?.split(',') as Array<'summaries' | 'attributes' | 'issues' | 'offers' | 'fulfillmentAvailability' | 'procurement' | 'relationships' | 'productTypes'> || undefined;
    const issueLocale = searchParams.get('issueLocale') || undefined;

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    if (!params.sellerId || !params.sku) {
      return NextResponse.json({ 
        error: 'sellerId and sku parameters are required' 
      }, { status: 400 });
    }

    const data = await listingsService.getListingsItem(
      params.sellerId,
      params.sku,
      marketplaceIds,
      includedData,
      issueLocale
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get listing item API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sellerId: string; sku: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const includedData = searchParams.get('includedData')?.split(',') as Array<'identifiers' | 'issues'> || undefined;
    const mode = searchParams.get('mode') as 'VALIDATION_PREVIEW' || undefined;
    const issueLocale = searchParams.get('issueLocale') || undefined;
    const body = await request.json();

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    if (!params.sellerId || !params.sku) {
      return NextResponse.json({ 
        error: 'sellerId and sku parameters are required' 
      }, { status: 400 });
    }

    if (!body.productType || !body.attributes) {
      return NextResponse.json({ 
        error: 'productType and attributes are required in request body' 
      }, { status: 400 });
    }

    const data = await listingsService.putListingsItem(
      params.sellerId,
      params.sku,
      marketplaceIds,
      body,
      includedData,
      mode,
      issueLocale
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Put listing item API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sellerId: string; sku: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const issueLocale = searchParams.get('issueLocale') || undefined;

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    if (!params.sellerId || !params.sku) {
      return NextResponse.json({ 
        error: 'sellerId and sku parameters are required' 
      }, { status: 400 });
    }

    const data = await listingsService.deleteListingsItem(
      params.sellerId,
      params.sku,
      marketplaceIds,
      issueLocale
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete listing item API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sellerId: string; sku: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    const includedData = searchParams.get('includedData')?.split(',') as Array<'identifiers' | 'issues'> || undefined;
    const mode = searchParams.get('mode') as 'VALIDATION_PREVIEW' || undefined;
    const issueLocale = searchParams.get('issueLocale') || undefined;
    const body = await request.json();

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    if (!params.sellerId || !params.sku) {
      return NextResponse.json({ 
        error: 'sellerId and sku parameters are required' 
      }, { status: 400 });
    }

    if (!body.productType || !body.patches || !Array.isArray(body.patches) || body.patches.length === 0) {
      return NextResponse.json({ 
        error: 'productType and patches array (minimum 1 item) are required in request body' 
      }, { status: 400 });
    }

    // Validate patch operations
    for (const patch of body.patches) {
      if (!patch.op || !patch.path || !['add', 'replace', 'delete'].includes(patch.op)) {
        return NextResponse.json({ 
          error: 'Each patch must have valid "op" (add/replace/delete) and "path" properties' 
        }, { status: 400 });
      }
    }

    const data = await listingsService.patchListingsItem(
      params.sellerId,
      params.sku,
      marketplaceIds,
      body,
      includedData,
      mode,
      issueLocale
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Patch listing item API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
