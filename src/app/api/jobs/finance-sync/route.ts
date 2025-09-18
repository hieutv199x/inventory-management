import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, NotificationType } from "@prisma/client";
import { NotificationService } from "@/lib/notification-service";
// Finance sync utilities
// Adjust imports to match your existing finance APIs
import { syncUnsettledTransactions } from "@/lib/tiktok-unsettled-transactions-sync";
import { syncPayments } from "@/lib/tiktok-payments-sync";
import { syncStatements } from "@/lib/tiktok-statement-sync";
import { syncWithdrawals } from "@/lib/tiktok-withdrawals-sync";
// If these do not exist yet, create/point them accordingly.

const prisma = new PrismaClient();

function getWindowFromQuery(req: NextRequest) {
  const url = new URL(req.url);
  const ge = url.searchParams.get("search_time_ge");
  const lt = url.searchParams.get("search_time_lt");
  const now = Math.floor(Date.now() / 1000);
  const halfDay = 12 * 60 * 60;

  const search_time_ge = ge ? Number(ge) : now - halfDay;
  const search_time_lt = lt ? Number(lt) : now;

  return { search_time_ge, search_time_lt };
}

export async function GET(req: NextRequest) {
  const startedAt = new Date().toISOString();
  const { search_time_ge, search_time_lt } = getWindowFromQuery(req);

  try {
    // Fetch all active shop authorizations; narrow this if your schema supports filtering
    const shops = await prisma.shopAuthorization.findMany({
      where: { status: 'ACTIVE' }
    });

    const summary: Array<{
      shop_id: string;
      results: {
        payments?: unknown;
        unsettled_transactions?: unknown;
        statements?: unknown;
        withdrawals?: unknown;
      };
      errors: string[];
    }> = [];

    for (const shop of shops) {
      const shopId = shop.shopId || shop.id;
      const errors: string[] = [];
      const results: Record<string, unknown> = {};
      // Per-shop sequential execution to be gentle on rate limits
      try {
        // Payments
        try {
          results.payments = await syncPayments(prisma, {
            shop_id: shop.id,
            search_time_ge,
            search_time_lt,
            page_size: 50,
          });
        } catch (e) {
          const msg = `payments:${e instanceof Error ? e.message : String(e)}`;
          errors.push(msg);
          await NotificationService.createNotification({
            type: NotificationType.SYSTEM_ALERT,
            title: "Finance Sync Error - Payments",
            message: `Shop ${shopId} payments sync failed: ${msg}`,
            userId: "system",
            shopId: shop.id,
            data: { shopId, search_time_ge, search_time_lt },
          });
        }

        // Unsettled Transactions
        try {
          results.unsettled_transactions = await syncUnsettledTransactions(prisma, {
            shop_id: shop.id,
            search_time_ge,
            search_time_lt,
            page_size: 50,
          });
        } catch (e) {
          const msg = `unsettled_transactions:${e instanceof Error ? e.message : String(e)}`;
          errors.push(msg);
          await NotificationService.createNotification({
            type: NotificationType.SYSTEM_ALERT,
            title: "Finance Sync Error - Unsettled",
            message: `Shop ${shopId} unsettled transactions sync failed: ${msg}`,
            userId: "system",
            shopId: shop.id,
            data: { shopId, search_time_ge, search_time_lt },
          });
        }

        // Statements, order statements by time
        try {
          results.statements = await syncStatements(prisma, {
            shop_id: shop.id,
            search_time_ge,
            search_time_lt,
            page_size: 50,
          });
        } catch (e) {
          const msg = `statements:${e instanceof Error ? e.message : String(e)}`;
          errors.push(msg);
          await NotificationService.createNotification({
            type: NotificationType.SYSTEM_ALERT,
            title: "Finance Sync Error - Statements",
            message: `Shop ${shopId} statements sync failed: ${msg}`,
            userId: "system",
            shopId: shop.id,
            data: { shopId, search_time_ge, search_time_lt },
          });
        }
        
        // Withdrawals
        try {
          results.withdrawals = await syncWithdrawals(prisma, {
            shop_id: shop.id,
            search_time_ge,
            search_time_lt,
            page_size: 50,
          });
        } catch (e) {
          const msg = `withdrawals:${e instanceof Error ? e.message : String(e)}`;
          errors.push(msg);
          await NotificationService.createNotification({
            type: NotificationType.SYSTEM_ALERT,
            title: "Finance Sync Error - Withdrawals",
            message: `Shop ${shopId} withdrawals sync failed: ${msg}`,
            userId: "system",
            shopId: shop.id,
            data: { shopId, search_time_ge, search_time_lt },
          });
        }
        
      } finally {
        summary.push({
          shop_id: shopId,
          results,
          errors,
        });
      }
    }

    const endedAt = new Date().toISOString();
    return NextResponse.json({
      startedAt,
      endedAt,
      window: { search_time_ge, search_time_lt },
      shopsProcessed: summary.length,
      summary,
    });
  } catch (error) {
    console.error("Finance sync job failed:", error);
    return NextResponse.json(
      {
        message: "Finance sync job failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}