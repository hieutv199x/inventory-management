import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Channel } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filter parameters
    const shopId = searchParams.get('shopId');
    const status = searchParams.get('status');
    const channelParam = searchParams.get('channel');
    const channel = channelParam && channelParam !== 'all' ? channelParam as Channel : null;
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'createTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase();

    // Build where clause
    const where: any = {};

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

    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { buyerEmail: { contains: search, mode: 'insensitive' } },
        { buyerMessage: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createTime = {};
      if (dateFrom) {
        where.createTime.gte = Math.floor(new Date(dateFrom).getTime() / 1000);
      }
      if (dateTo) {
        where.createTime.lte = Math.floor(new Date(dateTo + 'T23:59:59').getTime() / 1000);
      }
    }

    // Get total count for pagination
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
            shopId: true
          }
        },
        unsettledTransactions: {
          select: {
            id: true,
            estSettlementAmount: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip: offset,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: orders,
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