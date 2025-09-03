import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: { conversationId: string } }
) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        const { conversationId } = params;

        // Find conversation and check access
        const conversation = await prisma.conversation.findFirst({
            where: {
                conversationId: conversationId,
                channel: 'TIKTOK', // Add channel filter for TikTok conversations
                ...(isAdmin ? {} : { shopId: { in: accessibleShopIds } })
            },
            include: {
                participants: true,
                shop: {
                    select: {
                        shopId: true,
                        shopName: true
                    }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json(
                { error: 'Conversation not found or access denied' },
                { status: 404 }
            );
        }

        // Get messages for this conversation
        const messages = await prisma.conversationMessage.findMany({
            where: { conversationId: conversation.id },
            include: {
                sender: true
            },
            orderBy: { createTime: 'asc' }
        });

        return NextResponse.json({
            conversation,
            messages
        });

    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
