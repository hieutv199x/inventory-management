import { ordersService } from '@/lib/amazon-sp-api';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!params.orderId) {
      return NextResponse.json({ 
        error: 'orderId parameter is required' 
      }, { status: 400 });
    }

    const data = await ordersService.getOrder(params.orderId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
