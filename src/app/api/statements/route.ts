import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
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

    // Build where clause
    const where: any = {};

    // Shop access control
    if (!isAdmin) {
      where.shopId = { in: accessibleShopIds };
    } else if (shopId && shopId !== 'all') {
      const shop = await prisma.shopAuthorization.findUnique({
        where: { shopId: shopId }
      });
      if (shop) {
        where.shopId = shop.id;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.statementTime = {};
      if (startDate) {
        where.statementTime.gte = parseInt(startDate);
      }
      if (endDate) {
        where.statementTime.lte = parseInt(endDate);
      }
    }

    // Get total count for pagination
    const totalItems = await prisma.statement.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get statements with pagination
    const statements = await prisma.statement.findMany({
      where,
      include: {
        shop: {
          select: {
            shopName: true,
            shopId: true,
            managedName: true
          }
        }
      },
      orderBy: {
        statementTime: 'desc'
      },
      skip: offset,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: statements,
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
    console.error("Error fetching statements:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Internal error" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}