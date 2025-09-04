import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(request, prisma);

        // Check permissions - only Owner and Accountant roles
        if (!isAdmin && user.role !== 'ACCOUNTANT') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shopId');
        const alertType = searchParams.get('alertType');
        const status = searchParams.get('status');

        // Get shop ObjectID references for filtering
        let shopObjectIds: string[] = [];
        
        if (shopId && shopId !== 'all') {
            if (!isAdmin && !accessibleShopIds.includes(shopId)) {
                return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
            }
            const shopAuth = await prisma.shopAuthorization.findUnique({
                where: { shopId }
            });
            if (shopAuth) {
                shopObjectIds = [shopAuth.id];
            }
        } else if (!isAdmin) {
            const shopAuths = await prisma.shopAuthorization.findMany({
                where: { shopId: { in: accessibleShopIds } },
                select: { id: true }
            });
            shopObjectIds = shopAuths.map(s => s.id);
        }

        // Build where clause for payments
        let paymentWhere: any = {};
        if (shopObjectIds.length > 0) {
            paymentWhere.shopId = { in: shopObjectIds };
        }

        // Get payments with bank accounts and compare with shop's configured bank
        const payments = await prisma.payment.findMany({
            where: paymentWhere,
            select: {
                id: true,
                paymentId: true,
                amount: true,
                currency: true,
                paymentTime: true,
                bankAccount: true,
                shop: {
                    select: {
                        id: true,
                        shopId: true,
                        shopName: true,
                        bankAccounts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit for performance
        });

        // Process payments to detect fraud alerts
        const fraudAlerts = payments.map(payment => {
            const orderBankAccount = payment.bankAccount;
            const configuredBankAccount = payment.shop?.bankAccounts;
            
            let alertType: 'MISMATCH' | 'NO_BANK_ASSIGNED' | 'MATCHED';
            
            if (!configuredBankAccount) {
                alertType = 'NO_BANK_ASSIGNED';
            } else if (!orderBankAccount) {
                alertType = 'NO_BANK_ASSIGNED';
            } else if (!Array.isArray(configuredBankAccount) || !configuredBankAccount.some(acc => acc.accountNumber === orderBankAccount)) {
                alertType = 'MISMATCH';
            } else {
                alertType = 'MATCHED';
            }

            return {
                id: payment.id,
                orderId: payment.paymentId, // Using paymentId as orderId
                shopId: payment.shop?.shopId || '',
                shopName: payment.shop?.shopName || 'Unknown Shop',
                orderBankAccount,
                configuredBankAccount,
                alertType,
                amount: parseFloat(payment.amount) || 0,
                currency: payment.currency || 'USD',
                orderDate: payment.paymentTime || Date.now(),
                detectedDate: Date.now(),
                status: 'ACTIVE' as const,
                reviewedBy: null,
                reviewedAt: null,
                notes: null
            };
        });

        // Filter alerts based on request parameters
        let filteredAlerts = fraudAlerts;

        // Only show alerts that need attention (MISMATCH or NO_BANK_ASSIGNED)
        filteredAlerts = filteredAlerts.filter(alert => 
            alert.alertType === 'MISMATCH' || alert.alertType === 'NO_BANK_ASSIGNED'
        );

        if (alertType) {
            filteredAlerts = filteredAlerts.filter(alert => alert.alertType === alertType);
        }

        if (status) {
            filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
        }

        // Sort by most recent first and limit results
        filteredAlerts.sort((a, b) => b.detectedDate - a.detectedDate);
        filteredAlerts = filteredAlerts.slice(0, 100);

        return NextResponse.json({
            alerts: filteredAlerts,
            lastScanTime: Date.now() // Current scan time
        });

    } catch (error) {
        console.error('Error fetching fraud alerts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fraud alerts' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
