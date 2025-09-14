import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";
import { getUserWithShopAccess } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(req, prisma);
        
        const {
            shop_id,
            page_size = 20,
            sync = false
        } = await req.json();

        if (!shop_id) {
            return NextResponse.json(
                { error: "Missing required field: shop_id" },
                { status: 400 }
            );
        }

        // Check user access
        if (!isAdmin && !accessibleShopIds.includes(shop_id)) {
            return NextResponse.json(
                { error: "Access denied: You don't have permission to access this shop" },
                { status: 403 }
            );
        }

        // Get shop credentials
        const credentials = await prisma.shopAuthorization.findUnique({
            where: { shopId: shop_id, status: 'ACTIVE' },
            include: { app: true },
        });

        if (!credentials) {
            return NextResponse.json({ error: "Shop not found or inactive" }, { status: 404 });
        }

        const client = new TikTokShopNodeApiClient({
            config: {
                basePath: process.env.TIKTOK_BASE_URL,
                app_key: credentials.app?.appKey,
                app_secret: credentials.app?.appSecret,
            },
        });

        // Fetch all conversations with pagination
        const allConversations = await fetchAllConversations(client, credentials, page_size);
        console.log(`Fetched ${allConversations.length} conversations for shop ${shop_id}`);

        if (sync) {
            const syncedCount = await syncConversationsToDatabase(allConversations, shop_id);
            
            return NextResponse.json({
                conversations: allConversations,
                syncInfo: {
                    totalConversationsSynced: syncedCount,
                    pagesProcessed: Math.ceil(allConversations.length / page_size)
                }
            });
        }

        return NextResponse.json({ conversations: allConversations });

    } catch (error) {
        console.error('Error syncing conversations:', error);
        return NextResponse.json(
            { error: 'Failed to sync conversations' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

async function fetchAllConversations(client: any, credentials: any, pageSize: number) {
    let allConversations = [];
    let nextPageToken = "";

    try {
        // Get first page
        const result = await client.api.CustomerServiceV202309Api.ConversationsGet(
            pageSize,
            credentials.accessToken,
            "application/json",
            nextPageToken,
            "en",
            credentials.shopCipher
        );

        if (result.body?.data?.conversations) {
            allConversations.push(...result.body.data.conversations);
            nextPageToken = result.body.data.nextPageToken;

            // Continue fetching all pages
            while (nextPageToken) {
                try {
                    console.log(`Fetching next page of conversations with token: ${nextPageToken}`);
                    
                    const nextPageResult = await client.api.CustomerServiceV202309Api.ConversationsGet(
                        credentials.accessToken,
                        "application/json",
                        pageSize,
                        nextPageToken,
                        credentials.shopCipher
                    );

                    if (nextPageResult.body?.data?.conversations) {
                        allConversations.push(...nextPageResult.body.data.conversations);
                        console.log(`Fetched ${nextPageResult.body.data.conversations.length} more conversations. Total: ${allConversations.length}`);
                    }

                    nextPageToken = nextPageResult.body?.data?.nextPageToken;
                    
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (paginationError) {
                    console.error('Error fetching next page of conversations:', paginationError);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching conversations:', error);
    }

    return allConversations;
}

async function syncConversationsToDatabase(conversations: any[], shopId: string) {
    const BATCH_SIZE = 50;
    let totalSynced = 0;

    console.log(`Starting sync of ${conversations.length} conversations for shop ${shopId}`);

    // Process conversations in batches
    for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
        const batch = conversations.slice(i, i + BATCH_SIZE);
        const syncedCount = await processConversationBatch(batch, shopId);
        totalSynced += syncedCount;
        console.log(`Processed ${Math.min(i + BATCH_SIZE, conversations.length)} of ${conversations.length} conversations`);
    }

    return totalSynced;
}

async function processConversationBatch(conversations: any[], shopId: string) {
    let syncedCount = 0;

    try {
        const shopAuth = await prisma.shopAuthorization.findUnique({
            where: { shopId: shopId }
        });

        if (!shopAuth) {
            console.error(`Shop ${shopId} not found`);
            return 0;
        }

        // Removed prisma.$transaction (MongoDB setup - operations are now non-atomic)
        for (const conversation of conversations) {
            try {
                const savedConversation = await prisma.conversation.upsert({
                    where: { conversationId: conversation.id },
                    create: {
                        conversationId: conversation.id,
                        channel: 'TIKTOK',
                        participantCount: conversation.participant_count || 0,
                        canSendMessage: conversation.can_send_message || false,
                        unreadCount: conversation.unread_count || 0,
                        createTime: conversation.create_time || 0,
                        shopId: shopAuth.id,
                        channelData: JSON.stringify({ originalShopId: shopId })
                    },
                    update: {
                        participantCount: conversation.participant_count || 0,
                        canSendMessage: conversation.can_send_message || false,
                        unreadCount: conversation.unread_count || 0,
                    }
                });

                if (conversation.participants) {
                    await prisma.conversationParticipant.deleteMany({
                        where: { conversationId: savedConversation.id }
                    });

                    const participantData = conversation.participants.map((participant: any) => ({
                        participantId: participant.im_user_id,
                        userId: participant.user_id,
                        role: participant.role || '',
                        nickname: participant.nickname || '',
                        avatar: participant.avatar,
                        conversationId: savedConversation.id,
                        channelData: JSON.stringify({
                            buyerPlatform: participant.buyer_platform
                        })
                    }));

                    if (participantData.length) {
                        await prisma.conversationParticipant.createMany({ data: participantData });
                    }
                }

                if (conversation.latest_message) {
                    const latestMessage = conversation.latest_message;

                    let senderId: string | null = null;
                    if (latestMessage.sender?.im_user_id) {
                        const senderParticipant = await prisma.conversationParticipant.findFirst({
                            where: {
                                conversationId: savedConversation.id,
                                participantId: latestMessage.sender.im_user_id
                            }
                        });
                        senderId = senderParticipant?.id || null;
                    }

                    await prisma.conversationMessage.upsert({
                        where: { messageId: latestMessage.id },
                        create: {
                            messageId: latestMessage.id,
                            type: latestMessage.type || '',
                            content: latestMessage.content || '',
                            createTime: latestMessage.create_time || 0,
                            isVisible: latestMessage.is_visible ?? true,
                            conversationId: savedConversation.id,
                            senderId: senderId,
                            isLatestForId: savedConversation.id,
                            channelData: JSON.stringify({ messageIndex: latestMessage.index })
                        },
                        update: {
                            type: latestMessage.type || '',
                            content: latestMessage.content || '',
                            isVisible: latestMessage.is_visible ?? true,
                            channelData: JSON.stringify({ messageIndex: latestMessage.index })
                        }
                    });
                }

                syncedCount++;
            } catch (error) {
                console.error(`Error syncing conversation ${conversation.id}:`, error);
            }
        }

    } catch (error) {
        console.error('Error processing conversation batch:', error);
    }

    return syncedCount;
}