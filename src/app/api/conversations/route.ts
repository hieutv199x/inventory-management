import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get('shopId');
        const groupByShop = searchParams.get('groupByShop') === 'true';

        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);

        // Build shop filter
        let shopFilter = {};
        if (!isAdmin) {
            shopFilter = { shopId: { in: accessibleShopIds } };
        }
        if (shopId && (isAdmin || accessibleShopIds.includes(shopId))) {
            shopFilter = { shopId };
        }

        if (groupByShop) {
            // Get conversations grouped by shop
            const conversations = await prisma.conversation.findMany({
                where: shopFilter,
                include: {
                    participants: true,
                    latestMessage: {
                        include: {
                            sender: true
                        }
                    },
                    shop: {
                        select: {
                            shopId: true,
                            shopName: true
                        }
                    }
                },
                orderBy: [
                    { shopId: 'asc' },
                    { createTime: 'desc' }
                ]
            });

            // Group conversations by shop
            const groupedByShop = conversations.reduce((acc: any, conversation) => {
                const shopKey = conversation.shopId;
                if (!acc[shopKey]) {
                    acc[shopKey] = {
                        shopId: conversation.shopId,
                        shopName: conversation.shop.shopName || conversation.shopId,
                        conversations: [],
                        totalUnread: 0,
                        lastActivity: 0
                    };
                }
                
                acc[shopKey].conversations.push(conversation);
                acc[shopKey].totalUnread += conversation.unreadCount;
                if (conversation.createTime !== null && conversation.createTime !== undefined && conversation.createTime > acc[shopKey].lastActivity) {
                    acc[shopKey].lastActivity = conversation.createTime;
                }
                
                return acc;
            }, {});

            return NextResponse.json({
                shopGroups: Object.values(groupedByShop),
                totalShops: Object.keys(groupedByShop).length
            });
        } else {
            // Get individual conversations
            const conversations = await prisma.conversation.findMany({
                where: shopFilter,
                include: {
                    participants: true,
                    latestMessage: {
                        include: {
                            sender: true
                        }
                    },
                    shop: {
                        select: {
                            shopId: true,
                            shopName: true
                        }
                    }
                },
                orderBy: { createTime: 'desc' }
            });

            return NextResponse.json({ conversations });
        }

    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
