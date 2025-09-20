import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_KEYS = [
  'UNPAID',
  'ON_HOLD',
  'AWAITING_SHIPMENT',
  'PARTIALLY_SHIPPING',
  'AWAITING_COLLECTION',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shopId = url.searchParams.get('shopId') || '';
    const createTimeGe = url.searchParams.get('createTimeGe') || '';
    const createTimeLt = url.searchParams.get('createTimeLt') || '';
    const keyword = url.searchParams.get('keyword') || '';
    const customStatus = url.searchParams.get('customStatus') || '';

    // Build base where filter
    const where: any = {};

    if (shopId) {
      where.shopId = shopId;
    }

    if (createTimeGe || createTimeLt) {
      where.createTime = {};
      if (createTimeGe) where.createTime.gte = Number(createTimeGe);
      if (createTimeLt) where.createTime.lt = Number(createTimeLt);
    }

    if (keyword) {
      where.OR = [
        { orderId: { contains: keyword, mode: 'insensitive' } },
        { buyerEmail: { contains: keyword, mode: 'insensitive' } },
      ];
      // You can extend with recipient fields if they exist in schema
      // e.g., { recipientName: { contains: keyword, mode: 'insensitive' } }
    }

    if (customStatus) {
      if (customStatus === 'NOT_SET') {
        where.OR = [
          ...(where.OR || []),
          { customStatus: null },
          { customStatus: '' },
        ];
      } else {
        where.customStatus = customStatus;
      }
    }

    // Count per status in parallel
    const results = await Promise.all(
      STATUS_KEYS.map(async (status) => {
        const total = await prisma.order.count({
          where: { ...where, status },
        });
        return { status, total };
      })
    );

    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.status] = r.total;
    });

    // Overall total (same filters, no status)
    const total = await prisma.order.count({ where });

    return NextResponse.json({ counts, total });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get status counts' }, { status: 500 });
  }
}
