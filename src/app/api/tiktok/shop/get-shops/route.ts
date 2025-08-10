import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @method GET
 * @route /api/tiktok/shop/get-shops
 * @description Fetches all shops from the database.
 */

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '12', 10);
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        // Build where clause for search
        const whereClause = search
            ? {
                  OR: [
                      {
                          shopName: {
                              contains: search,
                              mode: 'insensitive' as const,
                          },
                      },
                      {
                          shopId: {
                              contains: search,
                              mode: 'insensitive' as const,
                          },
                      },
                      {
                          region: {
                              contains: search,
                              mode: 'insensitive' as const,
                          },
                      },
                      {
                          app: {
                              appName: {
                                  contains: search,
                                  mode: 'insensitive' as const,
                              },
                          },
                      },
                  ],
              }
            : {};

        // Get shops with search and pagination
        const [credentials, totalCount] = await Promise.all([
            prisma.shopAuthorization.findMany({
                where: whereClause,
                include: {
                    app: {
                        select: {
                            id: true,
                            appId: true,
                            appKey: true,
                            appSecret: true,
                            appName: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.shopAuthorization.count({
                where: whereClause,
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        // Transform the data to match frontend expectations
        const transformedCredentials = credentials.map((shop) => ({
            id: shop.id,
            shopId: shop.shopId,
            shopName: shop.shopName,
            shopCipher: shop.shopCipher,
            country: shop.region,
            status: shop.status,
            app: {
                appId: shop.app.appId,
                appKey: shop.app.appKey,
                appSecret: shop.app.appSecret,
                appName: shop.app.appName,
            },
            createdAt: shop.createdAt,
        }));

        return NextResponse.json({
            credentials: transformedCredentials,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shops' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}