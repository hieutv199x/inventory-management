import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getUserWithShopAccess } from '@/lib/auth';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

const prisma = new PrismaClient();

interface TrackingEntryRecord {
  id: string;
  trackingNumber: string;
  category: string | null;
  title: string;
  description: string | null;
  occurredAt: Date | null;
  sequence: number;
  source: string | null;
  createdAt: Date;
}

interface TrackingStateRecord {
  id: string;
  trackingNumber: string;
  providerName: string | null;
  providerType: string | null;
  providerServiceLevel: string | null;
  providerTrackingUrl: string | null;
  status: string | null;
  shop: {
    id: string;
    shopId: string;
    shopName: string | null;
    managedName: string | null;
  } | null;
  order: {
    id: string;
    orderId: string;
  } | null;
  timelineEntries: TrackingEntryRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const normalizePage = (value: string | null, fallback = 1) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const normalizeLimit = (value: string | null, fallback = 20, max = 100) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
};

export async function GET(request: NextRequest) {
  try {
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(request, prisma, true);

    const { searchParams } = new URL(request.url);

    const page = normalizePage(searchParams.get('page'), 1);
    const limit = normalizeLimit(searchParams.get('limit'), 20);
    const status = searchParams.get('status')?.trim();
    const search = searchParams.get('search')?.trim();
    const shopAuthId = searchParams.get('shopAuthId')?.trim();

    const baseWhere: Record<string, any> = {
      orgId: org.id,
    };

    if (!isAdmin) {
      if (!accessibleShopIds.length) {
        return NextResponse.json({
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
      baseWhere.shopId = { in: accessibleShopIds };
    }

    if (shopAuthId) {
      const hasAccess = isAdmin || accessibleShopIds.includes(shopAuthId);
      if (!hasAccess) {
        return NextResponse.json({
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
      baseWhere.shopId = shopAuthId;
    }

    if (status) {
      baseWhere.status = { equals: status, mode: 'insensitive' };
    }

    const filters: Record<string, any>[] = [];

    if (search) {
      const searchFilter: Record<string, any> = {
        OR: [
          { trackingNumber: { contains: search, mode: 'insensitive' } },
          { providerName: { contains: search, mode: 'insensitive' } },
          { providerServiceLevel: { contains: search, mode: 'insensitive' } },
          { order: { orderId: { contains: search, mode: 'insensitive' } } },
          { shop: { shopName: { contains: search, mode: 'insensitive' } } },
          { shop: { managedName: { contains: search, mode: 'insensitive' } } },
          { timelineEntries: { some: { title: { contains: search, mode: 'insensitive' } } } },
          { timelineEntries: { some: { description: { contains: search, mode: 'insensitive' } } } },
        ],
      };
      filters.push(searchFilter);
    }

    const where = filters.length > 0 ? { AND: [baseWhere, ...filters] } : baseWhere;

    const trackingStateDelegate = (prisma as any).fulfillmentTrackingState;

    if (!trackingStateDelegate) {
      throw Object.assign(new Error('Fulfillment tracking model is not available. Run prisma generate to update the client.'), { status: 500 });
    }

    const totalItems = await trackingStateDelegate.count({ where });
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const rawStates = (await trackingStateDelegate.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            shopId: true,
            shopName: true,
            managedName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderId: true,
          },
        },
        timelineEntries: {
          orderBy: [
            { occurredAt: 'asc' },
            { sequence: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    })) as TrackingStateRecord[];

    const data = rawStates.map((state: TrackingStateRecord) => ({
      id: state.id,
      trackingNumber: state.trackingNumber,
      providerName: state.providerName,
      providerType: state.providerType,
      providerServiceLevel: state.providerServiceLevel,
      providerTrackingUrl: state.providerTrackingUrl,
      status: state.status,
      shop: state.shop
        ? {
            id: state.shop.id,
            shopId: state.shop.shopId,
            shopName: state.shop.shopName,
            managedName: state.shop.managedName,
          }
        : null,
      order: state.order
        ? {
            id: state.order.id,
            orderId: state.order.orderId,
          }
        : null,
      timelineEntries: state.timelineEntries.map((entry: TrackingEntryRecord) => ({
        id: entry.id,
        trackingNumber: entry.trackingNumber,
        category: entry.category,
        title: entry.title,
        description: entry.description,
        occurredAt: entry.occurredAt ? entry.occurredAt.toISOString() : null,
        sequence: entry.sequence,
        source: entry.source,
      })),
      createdAt: state.createdAt.toISOString(),
      updatedAt: state.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      pagination: {
        currentPage: safePage,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: totalPages > 0 && safePage < totalPages,
        hasPrev: totalPages > 0 && safePage > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching fulfillment tracking states:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    const message = typeof error?.message === 'string' ? error.message : 'Failed to fetch fulfillment tracking states';
    return NextResponse.json({ error: message }, { status });
  } finally {
    await prisma.$disconnect();
  }
}
