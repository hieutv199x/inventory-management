import { Channel, PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";

export interface WithdrawalsSyncOptions {
  shop_id: string; // internal ObjectId
  search_time_ge: number;
  search_time_lt: number;
  page_size?: number;
}

export interface WithdrawalsSyncResult {
  success: boolean;
  shop_id: string;
  withdrawalsProcessed: number;
  withdrawalsSynced: number;
  errors: string[];
}

export async function syncWithdrawals(
  prisma: PrismaClient,
  options: WithdrawalsSyncOptions
): Promise<WithdrawalsSyncResult> {
  const errors: string[] = [];
  let withdrawalsProcessed = 0;
  let withdrawalsSynced = 0;

  try {
    // Load shop + app
    const shop = await prisma.shopAuthorization.findUnique({
      where: { id: options.shop_id },
      include: { app: true },
    });
    if (!shop) {
      throw new Error(`Shop ${options.shop_id} not found`);
    }
    if (!shop.app) {
      throw new Error(`Missing app information for shop ${shop.shopId}`);
    }

    // Extract shopCipher from channelData
    let shopCipher = shop.shopCipher;
    if (shop.channelData) {
      try {
        const channelData = JSON.parse(shop.channelData);
        shopCipher = channelData.shopCipher || shopCipher;
      } catch {
        console.warn(`Failed to parse channelData for shop ${shop.shopId}, using legacy shopCipher`);
      }
    }

    const credentials = {
      accessToken: shop.accessToken,
      shopCipher: shopCipher,
      app: shop.app,
    };

    if (!credentials.accessToken || !credentials.shopCipher) {
      throw new Error(`Missing credentials for shop ${shop.shopId}`);
    }

    let basePath = process.env.TIKTOK_BASE_URL;
    if (credentials.app?.BaseUrl) {
      basePath = credentials.app.BaseUrl;
    }

    // Create TikTok API client
    const client = new TikTokShopNodeApiClient({
      config: {
        basePath: basePath,
        app_key: credentials.app.appKey,
        app_secret: credentials.app.appSecret,
      },
    });

    // Fetch all withdrawals in the time range
    const withdrawals = await fetchAllWithdrawals(
      client,
      credentials,
      options.search_time_ge,
      options.search_time_lt,
      options.page_size || 50
    );

    withdrawalsProcessed = withdrawals.length;

    // Process each withdrawal
    for (const withdrawal of withdrawals) {
      try {
        await upsertWithdrawal(prisma, shop.id, withdrawal);
        withdrawalsSynced++;
      } catch (err: any) {
        errors.push(`Withdrawal ${withdrawal.withdrawalId}: ${err.message}`);
        console.error(`Failed to sync withdrawal ${withdrawal.withdrawalId}:`, err);
      }
    }

    return {
      success: true,
      shop_id: options.shop_id,
      withdrawalsProcessed,
      withdrawalsSynced,
      errors,
    };
  } catch (e: any) {
    errors.push(e?.message || String(e));
    return {
      success: false,
      shop_id: options.shop_id,
      withdrawalsProcessed,
      withdrawalsSynced,
      errors,
    };
  }
}

async function fetchAllWithdrawals(
  client: any,
  credentials: any,
  createTimeGe: number,
  createTimeLt: number,
  pageSize: number
) {
  let allWithdrawals: any[] = [];
  let nextPageToken = "";

  try {
    // First page - WithdrawalsGet parameters: types, accessToken, contentType, createTimeLt, pageSize, pageToken, createTimeGe, shopCipher
    // Types include: "SETTLEMENT", "MANUAL_WITHDRAWAL", "REFUND", "CHARGEBACK", "ADJUSTMENT"
    const withdrawalTypes = ["SETTLEMENT", "MANUAL_WITHDRAWAL", "REFUND", "CHARGEBACK", "ADJUSTMENT"];
    
    const result = await client.api.FinanceV202309Api.WithdrawalsGet(
      withdrawalTypes, // types array
      credentials.accessToken,
      "application/json",
      createTimeLt,
      pageSize,
      nextPageToken,
      createTimeGe,
      credentials.shopCipher
    );

    if (result.body?.data?.withdrawals) {
      allWithdrawals.push(...result.body.data.withdrawals);
      nextPageToken = result.body.data.nextPageToken;

      // Continue fetching all pages
      while (nextPageToken) {
        try {
          const nextPageResult = await client.api.FinanceV202309Api.WithdrawalsGet(
            withdrawalTypes,
            credentials.accessToken,
            "application/json",
            createTimeLt,
            pageSize,
            nextPageToken,
            createTimeGe,
            credentials.shopCipher
          );

          if (nextPageResult.body?.data?.withdrawals) {
            allWithdrawals.push(...nextPageResult.body.data.withdrawals);
            nextPageToken = nextPageResult.body.data.nextPageToken;
          } else {
            break;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (pageError) {
          console.warn(`Error fetching withdrawals page: ${pageError}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error in fetchAllWithdrawals:", error);
    throw error;
  }

  return allWithdrawals;
}

async function upsertWithdrawal(prisma: PrismaClient, shopId: string, withdrawal: any) {
  const withdrawalData = {
    withdrawalId: withdrawal.withdrawalId,
    channel: Channel.TIKTOK,
    amount: parseFloat(withdrawal.amount) || 0,
    status: withdrawal.status,
    currency: withdrawal.currency,
    type: withdrawal.type,
    createTime: withdrawal.createTime,
    shopId: shopId,
    channelData: JSON.stringify({
      originalWithdrawal: withdrawal,
      syncedAt: Date.now(),
    }),
  };

  await prisma.withdrawal.upsert({
    where: { withdrawalId: withdrawal.withdrawalId },
    update: {
      amount: withdrawalData.amount,
      status: withdrawalData.status,
      currency: withdrawalData.currency,
      type: withdrawalData.type,
      createTime: withdrawalData.createTime,
      channelData: withdrawalData.channelData,
      updatedAt: new Date(),
    },
    create: withdrawalData,
  });

  console.log(`Upserted withdrawal: ${withdrawal.withdrawalId}`);
}