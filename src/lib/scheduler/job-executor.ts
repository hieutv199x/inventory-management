import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { sync_all_shop_orders } from '../tiktok-order-sync-all-shop';

export interface JobResult {
    success: boolean;
    data?: any;
    error?: string;
}

export class JobExecutor {
    constructor(private prisma: PrismaClient) { }

    public async execute(job: any, executionId: string): Promise<JobResult> {
        try {
            const config = JSON.parse(job.config);

            switch (job.type) {
                case 'FUNCTION_CALL':
                    return await this.executeFunctionCall(config, job, executionId);
                case 'API_CALL':
                    return await this.executeApiCall(config, job, executionId);
                case 'DATABASE_QUERY':
                    return await this.executeDatabaseQuery(config, job, executionId);
                case 'WEBHOOK_TRIGGER':
                    return await this.executeWebhookTrigger(config, job, executionId);
                default:
                    throw new Error(`Unsupported job type: ${job.type}`);
            }
        } catch (error) {
            await this.logJobError(job, executionId, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async executeFunctionCall(config: any, job: any, executionId: string): Promise<JobResult> {
        const { functionName, params = {} } = config;

    await this.logJobInfo(job, executionId, `Calling function: ${functionName}`);

        // Map function names to actual implementations
        const functionMap: Record<string, Function> = {
            // Data sync functions
            'syncAllShopsOrders': this.syncAllShopsOrders.bind(this),

            // Maintenance functions
            'cleanupOldNotifications': this.cleanupOldNotifications.bind(this),
            'cleanupOldExecutions': this.cleanupOldExecutions.bind(this),
            'updateExpiredTokens': this.updateExpiredTokens.bind(this),

            // Business logic functions
            'processUnsentNotifications': this.processUnsentNotifications.bind(this),
            'generateDailyReports': this.generateDailyReports.bind(this),
            'checkLowInventory': this.checkLowInventory.bind(this),
            'updateOrderStatuses': this.updateOrderStatuses.bind(this),

            // Add more functions as needed
        };

        const func = functionMap[functionName];
        if (!func) {
            throw new Error(`Function not found: ${functionName}`);
        }

        const result = await func(params, job);
    await this.logJobInfo(job, executionId, `Function completed successfully`);

        return {
            success: true,
            data: result
        };
    }

    private async executeApiCall(config: any, job: any, executionId: string): Promise<JobResult> {
        const { url, method = 'GET', headers = {}, body = null, timeout = 30000 } = config;

    await this.logJobInfo(job, executionId, `Making API call: ${method} ${url}`);

        const response = await axios({
            url,
            method,
            headers,
            data: body,
            timeout
        });

    await this.logJobInfo(job, executionId, `API call completed with status: ${response.status}`);

        return {
            success: true,
            data: {
                status: response.status,
                data: response.data,
                headers: response.headers
            }
        };
    }

    private async executeDatabaseQuery(config: any, job: any, executionId: string): Promise<JobResult> {
        const { operation, model, data, where } = config;

    await this.logJobInfo(job, executionId, `Executing database operation: ${operation} on ${model}`);

        let result;
        const prismaModel = (this.prisma as any)[model];

        if (!prismaModel) {
            throw new Error(`Invalid model: ${model}`);
        }

        switch (operation) {
            case 'create':
                result = await prismaModel.create({ data });
                break;
            case 'update':
                result = await prismaModel.update({ where, data });
                break;
            case 'updateMany':
                result = await prismaModel.updateMany({ where, data });
                break;
            case 'delete':
                result = await prismaModel.delete({ where });
                break;
            case 'deleteMany':
                result = await prismaModel.deleteMany({ where });
                break;
            case 'findMany':
                result = await prismaModel.findMany({ where });
                break;
            default:
                throw new Error(`Unsupported database operation: ${operation}`);
        }

    await this.logJobInfo(job, executionId, `Database operation completed`);

        return {
            success: true,
            data: result
        };
    }

    private async executeWebhookTrigger(config: any, job: any, executionId: string): Promise<JobResult> {
        const { url, method = 'POST', headers = {}, payload = {} } = config;

    await this.logJobInfo(job, executionId, `Triggering webhook: ${method} ${url}`);

        const response = await axios({
            url,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            data: payload
        });

    await this.logJobInfo(job, executionId, `Webhook triggered successfully`);

        return {
            success: true,
            data: {
                status: response.status,
                response: response.data
            }
        };
    }


    private async syncAllShopsOrders(params: any, job: any): Promise<any> {
        const {
            channel = 'TIKTOK',
            limit = 50,
            day_to_sync = 1,
            batchSize,
            maxConcurrency,
            cursor
        } = params;

        if (channel !== 'TIKTOK') {
            throw new Error(`Unsupported channel for order sync: ${channel}`);
        }

        const result = await sync_all_shop_orders(limit, day_to_sync, {
            batchSize,
            maxConcurrency,
            cursor
        });

        return {
            totalShops: result.processed,
            skipped: result.skipped,
            failed: result.failed,
            nextCursor: result.nextCursor,
            durationMs: result.durationMs
        };
    }

    private async syncTikTokProducts(params: any, job: any): Promise<any> {
        const { shopId, limit = 50 } = params;

        if (!shopId) {
            throw new Error('shopId parameter is required for syncTikTokProducts');
        }

        // Call the TikTok product sync API
        const result = await fetch(`${process.env.NEXTAUTH_URL}/api/tiktok/products/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shopId, limit })
        });

        return await result.json();
    }

    private async syncAllShopsProducts(params: any, job: any): Promise<any> {
        const { channel = 'TIKTOK', limit = 50 } = params;

        // Get all active shops for the specified channel
        const shops = await this.prisma.shopAuthorization.findMany({
            where: {
                status: 'ACTIVE',
                app: {
                    channel: channel
                }
            },
            select: { shopId: true, shopName: true }
        });

        const results = [];
        for (const shop of shops) {
            try {
                const result = await this.syncTikTokProducts({ shopId: shop.shopId, limit }, job);
                results.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    shopId: shop.shopId,
                    shopName: shop.shopName,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return {
            totalShops: shops.length,
            results
        };
    }

    private async cleanupOldNotifications(params: any, job: any): Promise<any> {
        const { days = 30, onlyRead = true } = params;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const where: any = {
            createdAt: { lt: cutoffDate }
        };

        if (onlyRead) {
            where.read = true;
        }

        const deletedNotifications = await this.prisma.notification.deleteMany({
            where
        });

        return {
            message: `Cleaned up old notifications`,
            deletedCount: deletedNotifications.count,
            cutoffDate: cutoffDate.toISOString()
        };
    }

    private async cleanupOldExecutions(params: any, job: any): Promise<any> {
        const { days = 30 } = params;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const deletedExecutions = await this.prisma.jobExecution.deleteMany({
            where: {
                createdAt: { lt: cutoffDate }
            }
        });

        const deletedLogs = await this.prisma.jobLog.deleteMany({
            where: {
                timestamp: { lt: cutoffDate }
            }
        });

        return {
            message: `Cleaned up old job executions and logs`,
            deletedExecutions: deletedExecutions.count,
            deletedLogs: deletedLogs.count,
            cutoffDate: cutoffDate.toISOString()
        };
    }

    private async updateExpiredTokens(params: any, job: any): Promise<any> {
        const expiredAuths = await this.prisma.shopAuthorization.findMany({
            where: {
                status: 'ACTIVE',
                expiresIn: {
                    lt: Math.floor(Date.now() / 1000) + 86400 // Expires within 24 hours
                }
            }
        });

        const results = [];
        for (const auth of expiredAuths) {
            try {
                // Update status to EXPIRED for manual review
                await this.prisma.shopAuthorization.update({
                    where: { id: auth.id },
                    data: { status: 'EXPIRED' }
                });

                results.push({
                    shopId: auth.shopId,
                    shopName: auth.shopName,
                    success: true,
                    action: 'marked_as_expired'
                });
            } catch (error) {
                results.push({
                    shopId: auth.shopId,
                    shopName: auth.shopName,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return {
            message: 'Updated expired tokens',
            totalProcessed: expiredAuths.length,
            results
        };
    }

    private async processUnsentNotifications(params: any, job: any): Promise<any> {
        // This is a placeholder for notification processing logic
        // You would implement actual notification sending here
        return {
            message: 'Processed unsent notifications',
            processed: 0
        };
    }

    private async generateDailyReports(params: any, job: any): Promise<any> {
        // This is a placeholder for report generation logic
        return {
            message: 'Generated daily reports',
            reportsGenerated: 0
        };
    }

    private async checkLowInventory(params: any, job: any): Promise<any> {
        const { threshold = 10 } = params;

        const lowInventoryItems = await this.prisma.inventory.findMany({
            where: {
                quantity: { lte: threshold }
            },
            include: {
                sku: {
                    include: {
                        product: {
                            select: { title: true, shopId: true }
                        }
                    }
                }
            }
        });

        // Create notifications for low inventory
        for (const item of lowInventoryItems) {
            // Create notification logic here
        }

        return {
            message: 'Checked inventory levels',
            lowInventoryCount: lowInventoryItems.length,
            threshold
        };
    }

    private async updateOrderStatuses(params: any, job: any): Promise<any> {
        // This is a placeholder for order status update logic
        return {
            message: 'Updated order statuses',
            ordersUpdated: 0
        };
    }

    private async logJobInfo(job: { id: string; orgId?: string }, executionId: string, message: string, data?: any): Promise<void> {
        try {
            const orgId = job.orgId;
            if (!orgId) {
                console.warn('Skipping job info log because orgId is missing', { jobId: job.id });
                return;
            }
            await this.prisma.jobLog.create({
                data: {
                    jobId: job.id,
                    executionId,
                    level: 'INFO',
                    message,
                    data: data ? JSON.stringify(data) : undefined,
                    orgId
                }
            });
        } catch (error) {
            console.error('Error logging job info:', error);
        }
    }

    private async logJobError(job: { id: string; orgId?: string }, executionId: string, error: any): Promise<void> {
        try {
            const orgId = job.orgId;
            if (!orgId) {
                console.warn('Skipping job error log because orgId is missing', { jobId: job.id });
                return;
            }
            await this.prisma.jobLog.create({
                data: {
                    jobId: job.id,
                    executionId,
                    level: 'ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    data: JSON.stringify({
                        stack: error instanceof Error ? error.stack : undefined,
                        error: error.toString()
                    }),
                    orgId
                }
            });
        } catch (logError) {
            console.error('Error logging job error:', logError);
        }
    }
}