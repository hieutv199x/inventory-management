import { ordersService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketplaceIds = searchParams.get('marketplaceIds')?.split(',') || [];
    
    // Handle date parameters with validation
    let createdAfter = searchParams.get('createdAfter') || undefined;
    let createdBefore = searchParams.get('createdBefore') || undefined;
    let lastUpdatedAfter = searchParams.get('lastUpdatedAfter') || undefined;
    let lastUpdatedBefore = searchParams.get('lastUpdatedBefore') || undefined;

    // Validate date formats if provided
    const validateDate = (dateStr: string, paramName: string) => {
      if (isNaN(Date.parse(dateStr))) {
        throw new Error(`Invalid ${paramName} date format. Use ISO 8601 format (e.g., 2023-01-01T00:00:00Z)`);
      }
    };

    if (createdAfter) validateDate(createdAfter, 'createdAfter');
    if (createdBefore) validateDate(createdBefore, 'createdBefore');
    if (lastUpdatedAfter) validateDate(lastUpdatedAfter, 'lastUpdatedAfter');
    if (lastUpdatedBefore) validateDate(lastUpdatedBefore, 'lastUpdatedBefore');

    const orderStatuses = searchParams.get('orderStatuses')?.split(',') as Array<'Pending' | 'Unshipped' | 'PartiallyShipped' | 'Shipped' | 'Canceled' | 'Unfulfillable' | 'InvoiceUnconfirmed' | 'PendingAvailability'> || undefined;
    const fulfillmentChannels = searchParams.get('fulfillmentChannels')?.split(',') as Array<'MFN' | 'AFN'> || undefined;
    const paymentMethods = searchParams.get('paymentMethods')?.split(',') as Array<'COD' | 'CVS' | 'Other'> || undefined;
    const buyerEmail = searchParams.get('buyerEmail') || undefined;
    const sellerOrderId = searchParams.get('sellerOrderId') || undefined;
    const maxResultsPerPage = searchParams.get('maxResultsPerPage') 
      ? parseInt(searchParams.get('maxResultsPerPage')!) 
      : undefined;
    const easyShipShipmentStatuses = searchParams.get('easyShipShipmentStatuses')?.split(',') || undefined;
    const electronicInvoiceStatuses = searchParams.get('electronicInvoiceStatuses')?.split(',') as Array<'NotRequired' | 'NotFound' | 'Processing' | 'Errored' | 'Accepted'> || undefined;
    const nextToken = searchParams.get('nextToken') || undefined;
    const amazonOrderIds = searchParams.get('amazonOrderIds')?.split(',') || undefined;

    if (marketplaceIds.length === 0) {
      return NextResponse.json({ 
        error: 'marketplaceIds parameter is required' 
      }, { status: 400 });
    }

    // Validate maxResultsPerPage range
    if (maxResultsPerPage && (maxResultsPerPage < 1 || maxResultsPerPage > 100)) {
      return NextResponse.json({ 
        error: 'maxResultsPerPage must be between 1 and 100' 
      }, { status: 400 });
    }

    console.log('Orders API call with params:', {
      marketplaceIds,
      createdAfter,
      createdBefore,
      lastUpdatedAfter,
      lastUpdatedBefore,
      orderStatuses,
      fulfillmentChannels
    });

    const data = await ordersService.getOrders(
      marketplaceIds,
      createdAfter,
      createdBefore,
      lastUpdatedAfter,
      lastUpdatedBefore,
      orderStatuses,
      fulfillmentChannels,
      paymentMethods,
      buyerEmail,
      sellerOrderId,
      maxResultsPerPage,
      easyShipShipmentStatuses,
      electronicInvoiceStatuses,
      nextToken,
      amazonOrderIds
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
