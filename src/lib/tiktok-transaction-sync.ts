// import { PrismaClient } from "@prisma/client";

// interface TikTokTransaction {
//     transaction_id: string;
//     statement_id: string;
//     transaction_time: number;
//     type: string;
//     amount: string;
//     currency: string;
//     order_id?: string;
//     sku_id?: string;
//     product_name?: string;
//     description: string;
//     fee_details?: Array<{
//         fee_type: string;
//         fee_amount: string;
//     }>;
// }

// interface TransactionResponse {
//     code: number;
//     message: string;
//     data: {
//         transactions: TikTokTransaction[];
//         total: number;
//         more: boolean;
//     };
// }

// export async function getTransactionsByStatement(
//     shopId: string,
//     statementId: string,
//     accessToken: string,
//     pageSize: number = 50,
//     pageToken?: string
// ) {
//     const baseUrl = process.env.TIKTOK_SHOP_API_BASE_URL || 'https://open-api.tiktokglobalshop.com';
//     const appKey = process.env.TIKTOK_SHOP_APP_KEY;
//     const appSecret = process.env.TIKTOK_SHOP_APP_SECRET;

//     if (!appKey || !appSecret) {
//         throw new Error('TikTok Shop API credentials not configured');
//     }

//     const timestamp = Math.floor(Date.now() / 1000);
//     const path = '/api/finance/202309/statements/transactions';
    
//     const params = new URLSearchParams({
//         app_key: appKey,
//         timestamp: timestamp.toString(),
//         shop_cipher: shopId,
//         version: '202309',
//         statement_id: statementId,
//         page_size: pageSize.toString(),
//         ...(pageToken && { page_token: pageToken })
//     });

//     // Generate signature (simplified - you'll need proper HMAC-SHA256 signing)
//     const sign = generateTikTokSignature(path, params, appSecret);
//     params.append('sign', sign);

//     const url = `${baseUrl}${path}?${params.toString()}`;

//     const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//             'x-tts-access-token': accessToken,
//             'Content-Type': 'application/json',
//         },
//     });

//     if (!response.ok) {
//         throw new Error(`TikTok API request failed: ${response.status} ${response.statusText}`);
//     }

//     const data: TransactionResponse = await response.json();
    
//     if (data.code !== 0) {
//         throw new Error(`TikTok API error: ${data.message} (Code: ${data.code})`);
//     }

//     return data.data;
// }

// export async function syncTransactionsToDatabase(
//     prisma: PrismaClient,
//     shopId: string,
//     statementId: string,
//     transactions: TikTokTransaction[]
// ) {
//     const results = {
//         created: 0,
//         updated: 0,
//         errors: [] as string[]
//     };

//     for (const transaction of transactions) {
//         try {
//             await prisma.tikTokTransaction.upsert({
//                 where: {
//                     transaction_id: transaction.transaction_id
//                 },
//                 update: {
//                     statement_id: transaction.statement_id,
//                     transaction_time: new Date(transaction.transaction_time * 1000),
//                     type: transaction.type,
//                     currency: transaction.currency,
//                     order_id: transaction.order_id,
//                     sku_id: transaction.sku_id,
//                     product_name: transaction.product_name,
//                     description: transaction.description,
//                     fee_details: transaction.fee_details ? JSON.stringify(transaction.fee_details) : null,
//                     updated_at: new Date()
//                 },
//                 create: {
//                     transaction_id: transaction.transaction_id,
//                     shop_id: shopId,
//                     statement_id: transaction.statement_id,
//                     transaction_time: new Date(transaction.transaction_time * 1000),
//                     type: transaction.type,
//                     amount: parseFloat(transaction.amount),
//                     currency: transaction.currency,
//                     order_id: transaction.order_id,
//                     sku_id: transaction.sku_id,
//                     product_name: transaction.product_name,
//                     description: transaction.description,
//                     fee_details: transaction.fee_details ? JSON.stringify(transaction.fee_details) : null,
//                     created_at: new Date(),
//                     updated_at: new Date()
//                 }
//             });
//             results.created++;
//         } catch (error) {
//             results.errors.push(`Failed to sync transaction ${transaction.transaction_id}: ${error}`);
//         }
//     }

//     return results;
// }

// function generateTikTokSignature(path: string, params: URLSearchParams, appSecret: string): string {
//     // Implement proper HMAC-SHA256 signature generation
//     // This is a simplified placeholder - refer to TikTok Shop API documentation for exact implementation
//     const crypto = require('crypto');
//     const sortedParams = Array.from(params.entries()).sort();
//     const queryString = sortedParams.map(([key, value]) => `${key}${value}`).join('');
//     const stringToSign = `${path}${queryString}`;
    
//     return crypto.createHmac('sha256', appSecret).update(stringToSign).digest('hex');
// }
