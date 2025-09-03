import { NextRequest, NextResponse } from "next/server";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";
import { PrismaClient, Channel } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statementTimeGe = parseInt(searchParams.get("statementTimeGe") || "0", 10);
    const statementTimeLt = parseInt(searchParams.get("statementTimeLt") || "0", 10);

    if (!statementTimeGe || !statementTimeLt) {
      return NextResponse.json(
        { error: "Missing or invalid statementTimeGe or statementTimeLt" },
        { status: 400 }
      );
    }

    // Lấy thông tin shop và app
    const shops = await prisma.shopAuthorization.findMany({
      where: { 
        status: "ACTIVE",
        app: { channel: 'TIKTOK' } // Only get TikTok shops
      },
      include: {
        app: true,
      },
    });

    let totalWithdrawalsSynced = 0;
    const shopResults = [];

    for (const shop of shops) {
      try {
        // Extract shopCipher from channelData
        let shopCipher = shop.shopCipher; // Legacy field
        if (shop.channelData) {
          try {
            const channelData = JSON.parse(shop.channelData);
            shopCipher = channelData.shopCipher || shopCipher;
          } catch (error) {
            console.warn(`Failed to parse channelData for shop ${shop.shopId}, using legacy shopCipher`);
          }
        }

        if (!shop.app) {
          console.error(`Missing app information for shop ${shop.shopId}`);
          continue;
        }

        const credentials = {
          accessToken: shop.accessToken,
          shopCipher: shopCipher,
          app: {
            appKey: shop.app.appKey,
            appSecret: shop.app.appSecret,
          },
        };

        if (!credentials.accessToken || !credentials.shopCipher) {
          console.error(`Missing credentials for shop ${shop.shopId}`);
          continue;
        }

        const client = new TikTokShopNodeApiClient({
          config: {
            basePath: process.env.TIKTOK_BASE_URL,
            app_key: credentials.app.appKey,
            app_secret: credentials.app.appSecret,
          },
        });

        // Fetch all pages of withdrawals for this shop
        const allWithdrawals = await fetchAllWithdrawals(client, credentials, statementTimeGe, statementTimeLt);
        console.log(`Fetched ${allWithdrawals.length} withdrawals for shop ${shop.shopId}`);

        // Sync withdrawals in batches
        const syncedCount = await syncWithdrawalsToDatabase(allWithdrawals, shop.id); // Use ObjectId instead of shopId
        totalWithdrawalsSynced += syncedCount;

        shopResults.push({
          shopId: shop.shopId,
          shopName: shop.shopName,
          withdrawalsProcessed: allWithdrawals.length,
          withdrawalsSynced: syncedCount
        });

      } catch (error) {
        console.error(`Error processing shop ${shop.shopId}:`, error);
        shopResults.push({
          shopId: shop.shopId,
          shopName: shop.shopName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      totalWithdrawalsSynced,
      shopResults
    });
  } catch (err: unknown) {
    console.error("Error syncing TikTok withdrawals:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function fetchAllWithdrawals(client: any, credentials: any, statementTimeGe: number, statementTimeLt: number) {
  let allWithdrawals = [];
  const pageSize = 50;
  let nextPageToken = "";

  try {
    // Get first page
    const result = await client.api.FinanceV202309Api.WithdrawalsGet(
      ["WITHDRAW"],
      credentials.accessToken,
      "application/json",
      statementTimeLt,
      pageSize,
      nextPageToken,
      statementTimeGe,
      credentials.shopCipher
    );

    if (result?.body.data?.withdrawals) {
      allWithdrawals.push(...result.body.data.withdrawals);
      nextPageToken = result.body.data.nextPageToken;

      // Continue fetching all pages
      while (nextPageToken) {
        try {
          console.log(`Fetching next page of withdrawals with token: ${nextPageToken}`);
          
          const nextPageResult = await client.api.FinanceV202309Api.WithdrawalsGet(
            ["WITHDRAW"],
            credentials.accessToken,
            "application/json",
            statementTimeLt,
            pageSize,
            nextPageToken,
            statementTimeGe,
            credentials.shopCipher
          );

          if (nextPageResult?.body.data?.withdrawals) {
            allWithdrawals.push(...nextPageResult.body.data.withdrawals);
            console.log(`Fetched ${nextPageResult.body.data.withdrawals.length} more withdrawals. Total: ${allWithdrawals.length}`);
          }

          nextPageToken = nextPageResult.body?.data?.nextPageToken;
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (paginationError) {
          console.error('Error fetching next page of withdrawals:', paginationError);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
  }

  return allWithdrawals;
}

async function syncWithdrawalsToDatabase(withdrawals: any[], shopObjectId: string) {
  const BATCH_SIZE = 100;
  let totalSynced = 0;

  console.log(`Starting sync of ${withdrawals.length} withdrawals for shop ${shopObjectId} in batches of ${BATCH_SIZE}`);

  // Process withdrawals in batches
  for (let i = 0; i < withdrawals.length; i += BATCH_SIZE) {
    const batch = withdrawals.slice(i, i + BATCH_SIZE);
    const syncedCount = await processWithdrawalBatch(batch, shopObjectId);
    totalSynced += syncedCount;
    console.log(`Processed ${Math.min(i + BATCH_SIZE, withdrawals.length)} of ${withdrawals.length} withdrawals for shop ${shopObjectId}. Synced: ${syncedCount}`);
  }

  console.log(`Withdrawal sync completed for shop ${shopObjectId}. Total synced: ${totalSynced}`);
  return totalSynced;
}

async function processWithdrawalBatch(withdrawals: any[], shopObjectId: string) {
  let syncedCount = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // Get existing withdrawal IDs to avoid duplicates
      const withdrawalIds = withdrawals.map(w => w.id).filter(Boolean);
      const existingWithdrawals = await tx.withdrawal.findMany({
        where: { withdrawalId: { in: withdrawalIds } },
        select: { withdrawalId: true }
      });
      
      const existingWithdrawalIds = new Set(existingWithdrawals.map(w => w.withdrawalId));

      // Filter out existing withdrawals
      const newWithdrawals = withdrawals.filter(withdrawal => 
        withdrawal.id && !existingWithdrawalIds.has(withdrawal.id)
      );

      if (newWithdrawals.length > 0) {
        // Prepare batch data
        const withdrawalData = newWithdrawals.map(withdrawal => ({
          withdrawalId: withdrawal.id!,
          channel: Channel.TIKTOK, // Add channel field
          createTime: withdrawal.createTime ?? 0,
          status: withdrawal.status ?? "",
          amount: parseFloat(withdrawal.amount ?? "0"),
          currency: withdrawal.currency ?? "",
          type: withdrawal.type ?? "",
          channelData: JSON.stringify({}), // Store TikTok-specific data as JSON (empty for now)
          shopId: shopObjectId, // Use ObjectId reference
        }));

        // Batch create withdrawals
        await tx.withdrawal.createMany({
          data: withdrawalData,
        });

        syncedCount = withdrawalData.length;
      }
    }, {
      maxWait: 30000,
      timeout: 60000,
    });

  } catch (error) {
    console.error(`Error processing withdrawal batch for shop ${shopObjectId}:`, error);
  }

  return syncedCount;
}