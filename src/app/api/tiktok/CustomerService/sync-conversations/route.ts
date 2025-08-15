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
            page_size = 50,
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
                app_key: credentials.app.appKey,
                app_secret: credentials.app.appSecret,
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
            credentials.accessToken,
            "application/json",
            pageSize,
            nextPageToken,
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
        await prisma.$transaction(async (tx) => {
            for (const conversation of conversations) {
                try {
                    // Upsert conversation
                    const savedConversation = await tx.tikTokConversation.upsert({
                        where: { conversationId: conversation.id },
                        create: {
                            conversationId: conversation.id,
                            participantCount: conversation.participant_count || 0,
                            canSendMessage: conversation.can_send_message || false,
                            unreadCount: conversation.unread_count || 0,
                            createTime: conversation.create_time || 0,
                            shopId: shopId,
                        },
                        update: {
                            participantCount: conversation.participant_count || 0,
                            canSendMessage: conversation.can_send_message || false,
                            unreadCount: conversation.unread_count || 0,
                        }
                    });

                    // Sync participants
                    if (conversation.participants) {
                        // Delete existing participants
                        await tx.tikTokConversationParticipant.deleteMany({
                            where: { conversationId: savedConversation.id }
                        });

                        // Create new participants
                        const participantData = conversation.participants.map((participant: any) => ({
                            imUserId: participant.im_user_id,
                            userId: participant.user_id,
                            role: participant.role || '',
                            nickname: participant.nickname || '',
                            avatar: participant.avatar,
                            buyerPlatform: participant.buyer_platform,
                            conversationId: savedConversation.id,
                        }));

                        await tx.tikTokConversationParticipant.createMany({
                            data: participantData,
                        });
                    }

                    // Sync latest message
                    if (conversation.latest_message) {
                        const latestMessage = conversation.latest_message;
                        
                        // Find sender participant
                        let senderId = null;
                        if (latestMessage.sender?.im_user_id) {
                            const senderParticipant = await tx.tikTokConversationParticipant.findFirst({
                                where: {
                                    conversationId: savedConversation.id,
                                    imUserId: latestMessage.sender.im_user_id
                                }
                            });
                            senderId = senderParticipant?.id;
                        }

                        await tx.tikTokConversationMessage.upsert({
                            where: { messageId: latestMessage.id },
                            create: {
                                messageId: latestMessage.id,
                                type: latestMessage.type || '',
                                content: latestMessage.content || '',
                                createTime: latestMessage.create_time || 0,
                                isVisible: latestMessage.is_visible || true,
                                messageIndex: latestMessage.index,
                                conversationId: savedConversation.id,
                                senderId: senderId,
                                isLatestForId: savedConversation.id,
                            },
                            update: {
                                type: latestMessage.type || '',
                                content: latestMessage.content || '',
                                isVisible: latestMessage.is_visible || true,
                                messageIndex: latestMessage.index,
                            }
                        });
                    }

                    syncedCount++;
                } catch (error) {
                    console.error(`Error syncing conversation ${conversation.id}:`, error);
                }
            }
        }, {
            maxWait: 30000,
            timeout: 60000,
        });

    } catch (error) {
        console.error('Error processing conversation batch:', error);
    }

    return syncedCount;
}
