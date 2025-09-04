import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { user, accessibleShopIds, isAdmin } = await getUserWithShopAccess(request, prisma);

        // Check permissions - only Owner and Accountant roles
        if (!isAdmin && user.role !== 'ACCOUNTANT') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const body = await request.json();
        const requestedShopId = body.shopId;

        // Get shop ObjectID references for scanning
        let shopObjectIds: string[] = [];
        
        if (requestedShopId && requestedShopId !== 'all') {
            if (!isAdmin && !accessibleShopIds.includes(requestedShopId)) {
                return NextResponse.json({ error: 'Access denied to this shop' }, { status: 403 });
            }
            const shopAuth = await prisma.shopAuthorization.findUnique({
                where: { shopId: requestedShopId }
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

        // Get recent payments (last 7 days) with bank accounts
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        paymentWhere.paymentTime = { gte: sevenDaysAgo };

        const payments = await prisma.payment.findMany({
            where: paymentWhere,
            include: {
                shop: {
                    select: {
                        id: true,
                        shopId: true,
                        shopName: true,
                        bankAccounts: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Count new alerts found
        let newAlertsCount = 0;

        payments.forEach(payment => {
            const orderBankAccount = payment.bankAccount;
            const configuredBankAccounts = payment.shop?.bankAccounts;
            
            // Only count as alert if there's a mismatch or no bank assigned
            if (
                !configuredBankAccounts ||
                !orderBankAccount ||
                !configuredBankAccounts.some(
                    (acc: any) => acc.accountNumber === orderBankAccount
                )
            ) {
                newAlertsCount++;
            }
        });

        return NextResponse.json({
            message: 'Fraud alert scan completed',
            newAlerts: newAlertsCount,
            scannedPayments: payments.length,
            scanTime: Date.now()
        });

    } catch (error) {
        console.error('Error running fraud alert scan:', error);
        return NextResponse.json(
            { error: 'Failed to run fraud alert scan' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
