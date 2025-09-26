import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Channel } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { computeUKAddress } from "@/utils/common/functionFormat";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filter parameters
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const customStatus = searchParams.get('customStatus');
    const channelParam = searchParams.get('channel');
    const channel = channelParam && channelParam !== 'all' ? channelParam as Channel : null;
    const keyword = searchParams.get('keyword') || searchParams.get('search');
    const createTimeGe = searchParams.get('createTimeGe');
    const createTimeLt = searchParams.get('createTimeLt');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase();
    const alert = searchParams.get('alert'); // custom alert filter

    // SLA / deadline & milestone time filters (accept *Ge, *Gt, *Lt, *Le, *Eq suffixes)
    const numericTimeFields = [
      'shippingDueTime',
      'collectionDueTime',
      'deliveryDueTime',
      'cancelOrderSlaTime',
      'ttsSlaTime',
      'rtsSlaTime',
      'deliverySlaTime',
      'fastDispatchSlaTime',
      'pickUpCutOffTime',
      'deliveryOptionRequiredDeliveryTime',
      'cancelTime',
      'requestCancelTime',
      'rtsTime',
      'collectionTime',
      'releaseDate'
    ] as const;

    // Build where clause
    let where: any = {};

    // Shop access control
    if (!isAdmin && !shopId) {
      where.shopId = { in: accessibleShopIds };
    } else if (shopId) {
      where.shopId = shopId;
    }

    // Other filters
    if (status && status !== 'all') {
      where.status = status;
    }
    if (channel) {
      where.channel = channel;
    }

    if (keyword) {
      where.OR = [
        { orderId: { contains: keyword, mode: 'insensitive' } },
        { buyerEmail: { contains: keyword, mode: 'insensitive' } },
        { buyerMessage: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    // Add customStatus filter
    if (customStatus && customStatus !== 'all') {
      (where.AND ??= []);

      if (customStatus === 'NOT_SET') {
        // Include documents where customStatus is missing, null, empty string, or any value not in ['DELIVERED','SPLITTED']
        where.AND.push({
          OR: [
            { customStatus: { isSet: false } },
            { customStatus: null },
            { customStatus: '' },
            { customStatus: { notIn: ['DELIVERED', 'SPLITTED'] } },
          ],
        });
        where.AND.push({ status: { in: ['AWAITING_SHIPMENT'] } });
      } else {
        // Support CSV values e.g. ?customStatus=SPLITTED,DELIVERED
        const list = customStatus.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 1) {
          where.AND.push({ customStatus: { in: list } });
        } else {
          where.AND.push({ customStatus });
        }
      }
    }

    // Date range filter - support both timestamp and date string
    if (createTimeGe || createTimeLt || dateFrom || dateTo) {
      where.createTime = {};

      // Priority: use timestamp parameters if available
      if (createTimeGe) {
        where.createTime.gte = parseInt(createTimeGe);
      } else if (dateFrom) {
        where.createTime.gte = Math.floor(new Date(dateFrom).getTime() / 1000);
      }

      if (createTimeLt) {
        where.createTime.lte = parseInt(createTimeLt);
      } else if (dateTo) {
        where.createTime.lte = Math.floor(new Date(dateTo).getTime() / 1000);
      }
    }

    // Generic numeric range filters for SLA/milestone fields
    for (const field of numericTimeFields) {
      const base = field;
      const ge = searchParams.get(`${base}Ge`);
      const gt = searchParams.get(`${base}Gt`);
      const lt = searchParams.get(`${base}Lt`);
      const le = searchParams.get(`${base}Le`);
      const eq = searchParams.get(`${base}Eq`);
      if (ge || gt || lt || le || eq) {
        where[base] = {};
        if (ge) where[base].gte = parseInt(ge);
        if (gt) where[base].gt = parseInt(gt);
        if (lt) where[base].lt = parseInt(lt);
        if (le) where[base].lte = parseInt(le);
        if (eq) where[base].equals = parseInt(eq);
      }
    }

    // Get total count for pagination
    // Apply alert-specific filters AFTER base filters so pagination reflects narrowed set
    if (alert) {
      where = {};
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursFromNow = now + 24 * 60 * 60;
      switch (alert) {
        case 'countShipingWithin24':
          // AWAITING_SHIPMENT created >48h ago
          where.status = 'AWAITING_SHIPMENT';
          (where.createTime ??= {});
          where.createTime.lt = now - 48 * 60 * 60;
          break;
        case 'countAutoCancelled':
          // Match alert route: ANY of (shippingDueTime in window & status != AWAITING_COLLECTION)
          // (collectionDueTime in window & status != IN_TRANSIT)
          // (deliveryDueTime in window & status != DELIVERED)
          // Remove a previously applied single status filter to avoid over-restricting
          if (where.status) {
            delete where.status;
          }
          (where.AND ??= []);
          where.AND.push({
            OR: [
              {
                shippingDueTime: { gt: now, lt: twentyFourHoursFromNow },
                status: { not: 'AWAITING_COLLECTION' }
              },
              {
                collectionDueTime: { gt: now, lt: twentyFourHoursFromNow },
                status: { not: 'IN_TRANSIT' }
              },
              {
                deliveryDueTime: { gt: now, lt: twentyFourHoursFromNow },
                status: { not: 'DELIVERED' }
              }
            ]
          });
          break;
        case 'countShippingOverdue':
          // AWAITING_SHIPMENT past shippingDueTime
          where.status = 'AWAITING_SHIPMENT';
          where.shippingDueTime = { gt: now };
          break;
        case 'countBuyerCancelled':
          // buyer requested cancellation but not cancelled yet
          where.status = { not: 'CANCELLED' };
          (where.channelData ??= {});
          // Keep simple contains match (string JSON) to align with alert endpoint
          where.channelData.contains = '"isBuyerRequestCancel"';
          break;
        case 'countLogisticsIssue':
          // Placeholder - no concrete logic yet; return empty by forcing false condition if desired
          break;
        case 'countReturnRefund':
          // Placeholder - similar; could look for refund flags in channelData later
          break;
      }
    }
    const totalItems = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        payment: true,
        lineItems: true,
        recipientAddress: true,
        shop: {
          select: {
            shopName: true,
            shopId: true,
            managedName: true
          }
        },
        unsettledTransactions: {
          select: {
            id: true,
            estSettlementAmount: true
          }
        },
        packages: {
          select: {
            packageId: true,
            trackingNumber: true,
            shippingProviderId: true,
            shippingProviderName: true,
            orderLineItemIds: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip: offset,
      take: limit
    });

    for (const order of orders) {
      // Compute and add UK formatted address if recipientAddress exists
      const address = order.recipientAddress;
      if (address) {
        const ukFormattedAddress = computeUKAddress(address);
        order.recipientAddress = {
          ...address,
          fullAddress: ukFormattedAddress
        };
      }
    }

    return NextResponse.json({
      success: true,
      orders: orders, // Frontend expects "orders" field
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    });

  } catch (err: any) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}