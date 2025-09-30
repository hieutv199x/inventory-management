import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { resolveOrgContext, requireOrg } from '@/lib/tenant-context';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const orgResult = await resolveOrgContext(req, prisma);
    const org = requireOrg(orgResult);
    // Debug: total (scoped) vs global (if super admin)
    const totalRecords = await prisma.tikTokTransaction.count({ where: { orgId: org.id } });
    console.log("Debug - Scoped TikTok transactions in DB (org)", org.id, ':', totalRecords);
    if (orgResult.superAdmin) {
      const globalTotal = await prisma.tikTokTransaction.count();
      console.log('Debug - Global total TikTok transactions:', globalTotal);
    }

    // Also check shops
    const totalShops = await prisma.shopAuthorization.count();
    console.log("Debug - Total shops in DB:", totalShops);

    if (totalRecords === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 25,
          hasNext: false,
          hasPrev: false
        },
        debug: "No data found in tiktok_transactions table"
      });
    }

  const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    // Filter parameters
    const shopId = searchParams.get('shop_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const transactionType = searchParams.get('type');
    const orderId = searchParams.get('order_id');

    // Build where clause
  const where: any = { orgId: org.id };

    // Shop access control - Convert internal IDs to TikTok shopIds
    if (!isAdmin) {
      // accessibleShopIds contains internal database IDs, need to convert to TikTok shopIds
      const accessibleShops = await prisma.shopAuthorization.findMany({
        where: { id: { in: accessibleShopIds }, orgId: org.id },
        select: { shopId: true }
      });
      const tikTokShopIds = accessibleShops.map(shop => shop.shopId);
      where.shopId = { in: tikTokShopIds };
    } else if (shopId && shopId !== 'all') {
      // Convert UI shopId (internal ID) to TikTok shopId
      const selectedShop = await prisma.shopAuthorization.findUnique({
        where: { id: shopId },
        select: { shopId: true, orgId: true }
      });
      if (selectedShop) {
        if (selectedShop.orgId !== org.id) {
          return NextResponse.json({ success: false, error: 'Shop does not belong to active organization' }, { status: 403 });
        }
        where.shopId = selectedShop.shopId;
      }
    }

    // Date range filter (using orderCreateTime)
    if (startDate || endDate) {
      where.orderCreateTime = {};
      if (startDate) {
        where.orderCreateTime.gte = new Date(parseInt(startDate) * 1000);
      }
      if (endDate) {
        where.orderCreateTime.lte = new Date(parseInt(endDate) * 1000);
      }
    }

    // Transaction type filter
    if (transactionType) {
      where.type = transactionType;
    }

    // Order ID filter
    if (orderId) {
      where.orderId = {
        contains: orderId,
        mode: 'insensitive'
      };
    }

    console.log("Debug - where clause:", JSON.stringify(where, null, 2));

    // Get total count for pagination
  const totalItems = await prisma.tikTokTransaction.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get TikTok transactions with pagination
    const tikTokTransactions = await prisma.tikTokTransaction.findMany({
      where,
      orderBy: {
        orderCreateTime: 'desc'
      },
      skip: offset,
      take: limit
    });

    console.log("Debug - found transactions count:", tikTokTransactions.length);
    if (tikTokTransactions.length > 0) {
      console.log("Debug - first transaction sample:", {
        id: tikTokTransactions[0].id,
        shopId: tikTokTransactions[0].shopId,
        orderId: tikTokTransactions[0].orderId,
        transactionId: tikTokTransactions[0].transactionId
      });
    }

    // Get shop information separately
    const shopIds = [...new Set(tikTokTransactions.map(t => t.shopId).filter(Boolean))];
    console.log("Debug - shopIds from transactions:", shopIds);
    
    const shops = await prisma.shopAuthorization.findMany({
      where: { shopId: { in: shopIds } },
      select: { shopId: true, shopName: true, managedName: true }
    });
    console.log("Debug - shops found:", shops);

    // Create a map for quick lookup
    const shopMap = new Map(shops.map(shop => [shop.shopId, shop]));
    console.log("Debug - shopMap:", Array.from(shopMap.entries()));

    // Map data to match frontend interface
    const mappedData = tikTokTransactions.map(transaction => {
      const shop = transaction.shopId ? shopMap.get(transaction.shopId) : null;
      return {
        id: transaction.id,
        orderId: transaction.orderId || '',
        shopId: transaction.shopId || '',
        shopName: shop?.shopName || 'Unknown Shop',
        managedName: shop?.managedName || 'Unknown Managed Name',
        currency: transaction.currency || 'USD',
        transactionType: transaction.type || '',
        status: transaction.reserveStatus || 'SETTLED',
        createTime: transaction.createdTime ? Math.floor(transaction.createdTime.getTime() / 1000) : 0,
        orderCreateTime: transaction.orderCreateTime ? Math.floor(transaction.orderCreateTime.getTime() / 1000) : 0,
        // Additional fields that might be useful
        transactionId: transaction.transactionId,
        adjustmentId: transaction.adjustmentId,
        statementId: transaction.statementId,
        transactionTime: transaction.createdAt ? Math.floor(transaction.createdAt.getTime() / 1000) : 0,
        settlementAmount: transaction.settlementAmount,
        adjustmentAmount: transaction.adjustmentAmount,
        feeTaxAmount: transaction.feeTaxAmount,
        revenueAmount: transaction.revenueAmount,
        shippingCostAmount: transaction.shippingCostAmount,
        reserveAmount: transaction.reserveAmount,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (err: any) {
    console.error("Error fetching unsettled transactions:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Internal error" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
