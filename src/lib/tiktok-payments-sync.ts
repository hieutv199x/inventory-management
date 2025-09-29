import { Channel, PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";

export interface PaymentsSyncOptions {
  shop_id: string; // internal ObjectId (matches original route usage)
  search_time_ge: number;
  search_time_lt: number;
  page_size?: number;
}

export interface PaymentsSyncResult {
  success: boolean;
  shop_id: string;
  paymentsProcessed: number;
  paymentsSynced: number;
  errors: string[];
}

export async function syncPayments(
  prisma: PrismaClient,
  options: PaymentsSyncOptions
): Promise<PaymentsSyncResult> {
  const errors: string[] = [];
  let paymentsProcessed = 0;
  let paymentsSynced = 0;

  try {
    // Load shop + app (original route prepared this externally)
    const shop = await prisma.shopAuthorization.findUnique({
      where: { id: options.shop_id },
      include: { app: true, organization: true },
    });
    if (!shop) {
      throw new Error(`Shop ${options.shop_id} not found`);
    }
    if (!shop.app) {
      throw new Error(`Missing app information for shop ${shop.shopId}`);
    }

    // Extract shopCipher from channelData (legacy-compatible)
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
      shopCipher,
      app: {
        appKey: shop.app.appKey,
        appSecret: shop.app.appSecret,
        BaseUrl: shop.app.BaseUrl,
      },
      organization: shop.organization,
    };

    if (!credentials.accessToken || !credentials.shopCipher) {
      throw new Error(`Missing credentials for shop ${shop.shopId}`);
    }

    let basePath = process.env.TIKTOK_BASE_URL;
    if (credentials.app?.BaseUrl) {
      basePath = credentials.app.BaseUrl;
    }

    const client = new TikTokShopNodeApiClient({
      config: {
        basePath: basePath,
        app_key: credentials.app.appKey,
        app_secret: credentials.app.appSecret,
      },
    });

    // Original pagination logic (FinanceV202309Api.PaymentsGet)
    const allPayments = await fetchAllPayments(
      client,
      credentials,
      options.search_time_ge,
      options.search_time_lt,
      options.page_size ?? 50
    );

    paymentsProcessed = allPayments.length;

    // Original DB sync (createMany) logic
    paymentsSynced = await syncPaymentsToDatabase(prisma, allPayments, shop.id, shop.organization.id);

    return {
      success: errors.length === 0,
      shop_id: options.shop_id,
      paymentsProcessed,
      paymentsSynced,
      errors,
    };
  } catch (e: any) {
    errors.push(e?.message || String(e));
    return {
      success: false,
      shop_id: options.shop_id,
      paymentsProcessed,
      paymentsSynced,
      errors,
    };
  }
}

async function fetchAllPayments(
  client: any,
  credentials: any,
  statementTimeGe: number,
  statementTimeLt: number,
  pageSize: number
) {
  let allPayments: any[] = [];
  let nextPageToken = "";

  try {
    // First page (unchanged signature/ordering)
    const result = await client.api.FinanceV202309Api.PaymentsGet(
      "create_time",
      credentials.accessToken,
      "application/json",
      statementTimeLt,
      pageSize,
      nextPageToken,
      "ASC",
      statementTimeGe,
      credentials.shopCipher
    );

    if (result.body?.data?.payments) {
      allPayments.push(...result.body.data.payments);
      nextPageToken = result.body.data.nextPageToken;

      // Continue fetching all pages
      while (nextPageToken) {
        try {
          const nextPageResult = await client.api.FinanceV202309Api.PaymentsGet(
            "create_time",
            credentials.accessToken,
            "application/json",
            statementTimeLt,
            pageSize,
            nextPageToken,
            "ASC",
            statementTimeGe,
            credentials.shopCipher
          );

          if (nextPageResult.body?.data?.payments) {
            allPayments.push(...nextPageResult.body.data.payments);
          }

          nextPageToken = nextPageResult.body?.data?.nextPageToken;

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (paginationError) {
          console.error("Error fetching next page of payments:", paginationError);
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching payments:", error);
  }

  return allPayments;
}

async function syncPaymentsToDatabase(
  prisma: PrismaClient,
  payments: any[],
  shopObjectId: string,
  organizationId: string
) {
  const BATCH_SIZE = 100;
  let totalSynced = 0;

  // Process payments in batches
  for (let i = 0; i < payments.length; i += BATCH_SIZE) {
    const batch = payments.slice(i, i + BATCH_SIZE);
    const syncedCount = await processPaymentBatch(prisma, batch, shopObjectId, organizationId);
    totalSynced += syncedCount;
  }

  return totalSynced;
}

async function processPaymentBatch(
  prisma: PrismaClient,
  payments: any[],
  shopObjectId: string,
  organizationId: string
) {
  let syncedCount = 0;

  try {
    // Get existing payment IDs to avoid duplicates
    const paymentIds = payments.map((p) => p.id).filter(Boolean);
    const existingPayments = await prisma.payment.findMany({
      where: { paymentId: { in: paymentIds } },
      select: { paymentId: true },
    });

    const existingPaymentIds = new Set(existingPayments.map((p) => p.paymentId));

    // Filter out existing payments
    const newPayments = payments.filter((payment) => {
      if (!payment.id) {
        return false;
      }
      if (existingPaymentIds.has(payment.id)) {
        return false;
      }
      return true;
    });

    if (newPayments.length > 0) {
      // Prepare batch data (unchanged field mapping)
      const paymentData = newPayments.map((payment) => {
        const channelData = {
          reserveAmountValue: payment.reserveAmount?.value,
          reserveAmountCurrency: payment.reserveAmount?.currency,
          paymentBeforeExchangeValue: payment.paymentAmountBeforeExchange?.value,
          paymentBeforeExchangeCurrency: payment.paymentAmountBeforeExchange?.currency,
          exchangeRate: payment.exchangeRate,
        };

        const paymentRecord = {
          paymentId: payment.id!,
          channel: Channel.TIKTOK,
          createTime: payment.createTime ?? 0,
          status: payment.status!,
          amountValue: payment.amount?.value,
          amountCurrency: payment.amount?.currency ?? "",
          settlementAmountValue: payment.settlementAmount?.value,
          settlementAmountCurrency: payment.settlementAmount?.currency ?? "",
          channelData: JSON.stringify(channelData),
          paidTime: payment.paidTime,
          bankAccount: payment.bankAccount ?? null,
          shopId: shopObjectId,
          orgId: organizationId,
        };

        return paymentRecord;
      });

      // Batch create payments
      const result = await prisma.payment.createMany({
        data: paymentData,
      });

      syncedCount = result.count;
    }
  } catch (error) {
    console.error(`Error processing payment batch for shop ${shopObjectId}:`, error);
  }

  return syncedCount;
}
