import { NextResponse } from 'next/server';
import { httpClient } from '@/lib/http-client';

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

    const baseParams = () => {
      const p = new URLSearchParams();
      p.append('page', '1');
      p.append('pageSize', '1');
      if (shopId) p.append('shopId', shopId);
      if (createTimeGe) p.append('createTimeGe', createTimeGe);
      if (createTimeLt) p.append('createTimeLt', createTimeLt);
      if (keyword) p.append('keyword', keyword);
      if (customStatus) p.append('customStatus', customStatus);
      return p;
    };

    const results = await Promise.all(
      STATUS_KEYS.map(async (status) => {
        const params = baseParams();
        params.append('status', status);
        try {
          const res = await httpClient.get(`/orders?${params.toString()}`);
          const total = res?.pagination?.totalItems ?? 0;
          return { status, total };
        } catch {
          return { status, total: 0 };
        }
      })
    );

    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.status] = r.total;
    });

    // Optional: overall total (same filters, no status)
    let total = 0;
    try {
      const params = baseParams();
      const res = await httpClient.get(`/orders?${params.toString()}`);
      total = res?.pagination?.totalItems ?? 0;
    } catch {
      total = 0;
    }

    return NextResponse.json({ counts, total });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get status counts' }, { status: 500 });
  }
}
