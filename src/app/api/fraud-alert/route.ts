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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

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

        // Add date range filter if provided
        if (startDate && endDate) {
            const startTimestamp = new Date(startDate).getTime();
            const endTimestamp = new Date(endDate).getTime();
            paymentWhere.paymentTime = {
                gte: startTimestamp,
                lte: endTimestamp
            };
        }

        // Get payments with shop and bank account data
        const payments = await prisma.payment.findMany({
            where: paymentWhere,
            include: {
                shop: {
                    select: {
                        id: true,
                        shopId: true,
                        shopName: true
                    }
                }
            },
            orderBy: { createTime: 'desc' },
            take: 500 // Limit for performance
        });

        // Get bank accounts for the shops
        const bankAccounts = await prisma.bankAccount.findMany({
            where: {
                shopId: { in: shopObjectIds.length > 0 ? shopObjectIds : undefined }
            },
            select: {
                shopId: true,
                accountNumber: true,
                setupDate: true
            }
        });

        // Get seller information for the shops
        const userShopRoles = await prisma.userShopRole.findMany({
            where: {
                shopId: { in: shopObjectIds.length > 0 ? shopObjectIds : undefined },
                role: 'SELLER' // Assuming SELLER role identifies the seller
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Create a map of shopId to seller info
        const sellerMap = new Map<string, {name: string, email: string}>();
        userShopRoles.forEach(usr => {
            if (usr.shopId && usr.user) {
                sellerMap.set(usr.shopId, {
                    name: usr.user.name || 'Unknown Seller',
                    email: usr.user.email
                });
            }
        });

        // Create a map of shopId to bank accounts with creation dates
        const bankAccountMap = new Map<string, Array<{accountNumber: string, createdAt: Date}>>();
        bankAccounts.forEach(ba => {
            if (ba.shopId) {
                const shopBankAccounts = bankAccountMap.get(ba.shopId) || [];
                if (ba.setupDate) {
                    shopBankAccounts.push({
                        accountNumber: ba.accountNumber,
                        createdAt: ba.setupDate
                    });
                }
                bankAccountMap.set(ba.shopId, shopBankAccounts);
            }
        });

        // Process payments to detect fraud alerts
        const fraudAlerts = payments.map(payment => {
            const paymentBankAccount = payment.bankAccount;
            const shopBankAccounts = bankAccountMap.get(payment.shopId);
            const sellerInfo = sellerMap.get(payment.shopId);

            let alertType: 'MISMATCH' | 'NO_BANK_ASSIGNED' | 'MATCHED';
            let configuredBankAccount: string | null = null;
            let bankCreatedDate: Date | null = null;

            if (!shopBankAccounts || shopBankAccounts.length === 0) {
                alertType = 'NO_BANK_ASSIGNED';
            } else if (!paymentBankAccount) {
                alertType = 'NO_BANK_ASSIGNED';
            } else {
                // Compare last 4 digits of bank accounts
                const paymentLast4 = paymentBankAccount.slice(-4);
                const matchingAccount = shopBankAccounts.find(acc => 
                    acc.accountNumber.slice(-4) === paymentLast4
                );

                if (matchingAccount) {
                    alertType = 'MATCHED';
                    configuredBankAccount = matchingAccount.accountNumber;
                    bankCreatedDate = matchingAccount.createdAt;
                } else {
                    alertType = 'MISMATCH';
                    configuredBankAccount = shopBankAccounts[0].accountNumber; // Show first configured account
                    bankCreatedDate = shopBankAccounts[0].createdAt;
                }
            }

            return {
                id: payment.id,
                paymentId: payment.paymentId,
                shopId: payment.shop?.shopId || '',
                shopName: payment.shop?.shopName || 'Unknown Shop',
                sellerName: sellerInfo?.name || 'Admin',
                sellerEmail: sellerInfo?.email || '',
                orderBankAccount: paymentBankAccount,
                configuredBankAccount,
                bankCreatedDate: bankCreatedDate ? bankCreatedDate.getTime() : null,
                alertType,
                amount: parseFloat(payment.amountValue ?? '0') || 0,
                currency: payment.amountCurrency || 'USD',
                paidTime: payment.paidTime || Date.now(),
                detectedDate: Date.now(),
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

