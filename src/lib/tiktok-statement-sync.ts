import { Channel, PrismaClient } from "@prisma/client";
import { TikTokShopNodeApiClient } from "@/nodejs_sdk";

export interface StatementsSyncOptions {
  shop_id: string; // internal ObjectId
  search_time_ge: number;
  search_time_lt: number;
  page_size?: number;
}

export interface StatementsSyncResult {
  success: boolean;
  shop_id: string;
  statementsProcessed: number;
  statementsSynced: number;
  transactionsSynced?: number; // Optional field for transaction sync count
  errors: string[];
}

export async function syncStatements(
  prisma: PrismaClient,
  options: StatementsSyncOptions
): Promise<StatementsSyncResult> {
  const errors: string[] = [];
  let statementsProcessed = 0;
  let statementsSynced = 0;

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

    // Fetch all statements in the time range
    const statements = await fetchAllStatements(
      client,
      credentials,
      options.search_time_ge,
      options.search_time_lt,
      options.page_size || 50
    );

    statementsProcessed = statements.length;

    // Process each statement
    for (const statement of statements) {
      try {
        await upsertStatement(prisma, shop.id, statement);
        statementsSynced++;
      } catch (err: any) {
        errors.push(`Statement ${statement.id}: ${err.message}`);
        console.error(`Failed to sync statement ${statement.id}:`, err);
      }
    }

    // After syncing statements, fetch statement transactions for each statement
    let transactionsSynced = 0;
    if (statementsSynced > 0) {
      console.log(`Fetching statement transactions for ${statements.length} statements...`);
      
      for (const statement of statements) {
        try {
          await fetchAndStoreStatementTransactions(
            client, 
            credentials, 
            prisma, 
            shop.id, 
            statement.id
          );
          transactionsSynced++;
          
          // Rate limiting between statement transaction calls
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (transactionErr: any) {
          errors.push(`Statement ${statement.id} transactions: ${transactionErr.message}`);
          console.error(`Failed to fetch transactions for statement ${statement.id}:`, transactionErr);
        }
      }
      
      console.log(`Fetched transactions for ${transactionsSynced}/${statements.length} statements`);
    }

    return {
      success: true,
      shop_id: options.shop_id,
      statementsProcessed,
      statementsSynced,
      transactionsSynced,
      errors,
    };
  } catch (e: any) {
    errors.push(e?.message || String(e));
    return {
      success: false,
      shop_id: options.shop_id,
      statementsProcessed,
      statementsSynced,
      transactionsSynced: 0, // Set to 0 in case of error
      errors,
    };
  }
}

async function fetchAllStatements(
  client: any,
  credentials: any,
  statementTimeGe: number,
  statementTimeLt: number,
  pageSize: number
) {
  let allStatements: any[] = [];
  let nextPageToken = "";

  try {
    // First page - StatementsGet parameters: sortField, accessToken, contentType, statementTimeLt, paymentStatus, pageSize, pageToken, sortOrder, statementTimeGe, shopCipher
    const result = await client.api.FinanceV202309Api.StatementsGet(
      "statement_time", // sortField
      credentials.accessToken,
      "application/json",
      statementTimeLt,
      undefined, // paymentStatus (optional)
      pageSize,
      nextPageToken,
      "ASC", // sortOrder
      statementTimeGe,
      credentials.shopCipher
    );

    if (result.body?.data?.statements) {
      allStatements.push(...result.body.data.statements);
      nextPageToken = result.body.data.nextPageToken;

      // Continue fetching all pages
      while (nextPageToken) {
        try {
          const nextPageResult = await client.api.FinanceV202309Api.StatementsGet(
            "statement_time",
            credentials.accessToken,
            "application/json",
            statementTimeLt,
            undefined,
            pageSize,
            nextPageToken,
            "ASC",
            statementTimeGe,
            credentials.shopCipher
          );

          if (nextPageResult.body?.data?.statements) {
            allStatements.push(...nextPageResult.body.data.statements);
            nextPageToken = nextPageResult.body.data.nextPageToken;
          } else {
            break;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (pageError) {
          console.warn(`Error fetching statements page: ${pageError}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error in fetchAllStatements:", error);
    throw error;
  }

  return allStatements;
}

async function upsertStatement(prisma: PrismaClient, shopId: string, statement: any) {
  const statementData = {
    statementId: statement.id,
    channel: Channel.TIKTOK,
    statementTime: statement.statementTime,
    settlementAmount: statement.settlementAmount,
    currency: statement.currency,
    paymentStatus: statement.paymentStatus,
    paymentId: statement.paymentId,
    shopId: shopId,
    channelData: JSON.stringify({
      revenueAmount: statement.revenueAmount,
      feeAmount: statement.feeAmount,
      adjustmentAmount: statement.adjustmentAmount,
      netSalesAmount: statement.netSalesAmount,
      originalStatement: statement,
      syncedAt: Date.now(),
    }),
  };

  await prisma.statement.upsert({
    where: { statementId: statement.id },
    update: {
      statementTime: statementData.statementTime,
      settlementAmount: statementData.settlementAmount,
      currency: statementData.currency, 
      paymentStatus: statementData.paymentStatus,
      paymentId: statementData.paymentId,
      channelData: statementData.channelData,
      updatedAt: new Date(),
    },
    create: statementData,
  });

  console.log(`Upserted statement: ${statement.id}`);
}

async function fetchAndStoreStatementTransactions(
  client: any,
  credentials: any,
  prisma: PrismaClient,
  shopId: string,
  statementId: string
) {
  try {
    console.log(`Fetching transactions for statement ${statementId}...`);
    
    // Call StatementsStatementIdStatementTransactionsGet API
    const transactionsResult = await client.api.FinanceV202309Api.StatementsStatementIdStatementTransactionsGet(
      statementId,
      "order_create_time", // sortField - must be "order_create_time" according to validation rule
      credentials.accessToken,
      "application/json",
      "", // page_token (start with empty)
      "ASC", // sortOrder
      50, // page_size
      credentials.shopCipher
    );

    let allTransactions: any[] = [];
    
    if (transactionsResult.body?.data?.statementTransactions) {
      allTransactions.push(...transactionsResult.body.data.statementTransactions);
      let nextPageToken = transactionsResult.body.data.nextPageToken;

      // Continue fetching all pages
      while (nextPageToken) {
        try {
          const nextPageResult = await client.api.FinanceV202309Api.StatementsStatementIdStatementTransactionsGet(
            statementId,
            "order_create_time", // sortField - must be "order_create_time"
            credentials.accessToken,
            "application/json",
            nextPageToken,
            "ASC", // sortOrder
            50, // page_size
            credentials.shopCipher
          );

          if (nextPageResult.body?.data?.statementTransactions) {
            allTransactions.push(...nextPageResult.body.data.statementTransactions);
            nextPageToken = nextPageResult.body.data.nextPageToken;
          } else {
            break;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (pageError) {
          console.warn(`Error fetching statement transactions page for ${statementId}: ${pageError}`);
          break;
        }
      }
    }

    // Save transactions to TikTokTransaction model
    let savedTransactions = 0;
    for (const transaction of allTransactions) {
      try {
        await upsertTikTokTransaction(prisma, shopId, statementId, transaction);
        savedTransactions++;
      } catch (transactionErr) {
        console.error(`Failed to save transaction ${transaction.transactionId}:`, transactionErr);
      }
    }

    console.log(`Saved ${savedTransactions}/${allTransactions.length} transactions for statement ${statementId}`);

  } catch (error) {
    console.error(`Error fetching transactions for statement ${statementId}:`, error);
    throw error;
  }
}

async function upsertTikTokTransaction(
  prisma: PrismaClient,
  shopId: string,
  statementId: string,
  transaction: any
) {
  const transactionData = {
    transactionId: transaction.transactionId,
    shopId: shopId,
    statementId: statementId,
    type: transaction.type || 'UNKNOWN',
    currency: transaction.currency || 'USD',
    createdTime: transaction.createdTime ? new Date(transaction.createdTime * 1000) : null,
    
    // Financial amounts
    settlementAmount: parseFloat(transaction.settlementAmount) || 0,
    adjustmentAmount: transaction.adjustmentAmount ? parseFloat(transaction.adjustmentAmount) : null,
    revenueAmount: transaction.revenueAmount ? parseFloat(transaction.revenueAmount) : null,
    shippingCostAmount: transaction.shippingCostAmount ? parseFloat(transaction.shippingCostAmount) : null,
    feeTaxAmount: transaction.feeTaxAmount ? parseFloat(transaction.feeTaxAmount) : null,
    reserveAmount: transaction.reserveAmount ? parseFloat(transaction.reserveAmount) : null,

    // Order information
    orderId: transaction.orderId || null,
    orderCreateTime: transaction.orderCreateTime ? new Date(transaction.orderCreateTime * 1000) : null,
    adjustmentId: transaction.adjustmentId || null,
    adjustmentOrderId: transaction.adjustmentOrderId || null,
    associatedOrderId: transaction.associatedOrderId || null,

    // Reserve info
    reserveId: transaction.reserveId || null,
    reserveStatus: transaction.reserveStatus || null,
    estimatedReleaseTime: transaction.estimatedReleaseTime ? new Date(transaction.estimatedReleaseTime * 1000) : null,

    // Breakdown fields as JSON
    revenueBreakdown: transaction.revenueBreakdown || null,
    shippingCostBreakdown: transaction.shippingCostBreakdown || null,
    feeTaxBreakdown: transaction.feeTaxBreakdown || null,
    supplementaryComponent: transaction.supplementaryComponent || null,
  };

  // Check if transaction already exists
  const existingTransaction = await prisma.tikTokTransaction.findFirst({
    where: {
      shopId: shopId,
      transactionId: transaction.transactionId,
    }
  });

  if (existingTransaction) {
    // Update existing transaction
    await prisma.tikTokTransaction.update({
      where: { id: existingTransaction.id },
      data: {
        ...transactionData,
        updatedAt: new Date(),
      }
    });
  } else {
    // Create new transaction
    await prisma.tikTokTransaction.create({
      data: transactionData
    });
  }

  console.log(`Upserted TikTok transaction: ${transaction.transactionId} for statement ${statementId}`);
}
