import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';

const prisma = new PrismaClient();

const TELEGRAM_API_BASE = 'https://api.telegram.org';

interface TrackingStateDetail {
  trackingNumber: string;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  shop?: {
    shopName: string | null;
    managedName: string | null;
  } | null;
  order?: {
    orderId: string;
  } | null;
}

interface OrgSummary {
  orgId: string;
  orgName: string;
  warning: number;
  critical: number;
  warningStates: TrackingStateDetail[];
  criticalStates: TrackingStateDetail[];
}

async function sendTelegramMessage(params: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<void> {
  const url = `${TELEGRAM_API_BASE}/bot${params.botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '<unable to parse error body>');
    throw new Error(`Telegram API responded with ${response.status}: ${errorBody}`);
  }
}

function buildTrackingAlertMessage(params: {
  orgName: string;
  warningCount: number;
  criticalCount: number;
  warningStates: TrackingStateDetail[];
  criticalStates: TrackingStateDetail[];
}): string {
  const lines: string[] = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = now.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });

  lines.push('⚠️ BÁO CÁO CẢNH BÁO VẬN CHUYỂN PROCESSING');
  lines.push(`📅 ${dateStr} ${timeStr}`);
  lines.push(`🏢 Tổ chức: ${params.orgName}`);
  lines.push('');

  if (params.warningCount === 0 && params.criticalCount === 0) {
    lines.push('✅ Không có vận đơn nào cần cảnh báo.');
    return lines.join('\n');
  }

  if (params.warningCount > 0) {
    lines.push(`🟡 CẢNH BÁO (8-9 ngày): ${params.warningCount} vận đơn`);
    const topWarning = params.warningStates.slice(0, 5);
    for (const state of topWarning) {
      const shopName = state.shop?.managedName || state.shop?.shopName || 'N/A';
      const orderId = state.order?.orderId || 'N/A';
      const days = differenceInCalendarDays(now, state.updatedAt || state.createdAt);
      lines.push(`  • ${state.trackingNumber}`);
      lines.push(`    ${shopName} | Đơn: ${orderId} | ${days} ngày`);
    }
    if (params.warningStates.length > 5) {
      lines.push(`  • ...và ${params.warningStates.length - 5} vận đơn khác`);
    }
    lines.push('');
  }

  if (params.criticalCount > 0) {
    lines.push(`🔴 NGUY CẤP (10+ ngày): ${params.criticalCount} vận đơn`);
    const topCritical = params.criticalStates.slice(0, 5);
    for (const state of topCritical) {
      const shopName = state.shop?.managedName || state.shop?.shopName || 'N/A';
      const orderId = state.order?.orderId || 'N/A';
      const days = differenceInCalendarDays(now, state.updatedAt || state.createdAt);
      lines.push(`  • ${state.trackingNumber}`);
      lines.push(`    ${shopName} | Đơn: ${orderId} | ${days} ngày`);
    }
    if (params.criticalStates.length > 5) {
      lines.push(`  • ...và ${params.criticalStates.length - 5} vận đơn khác`);
    }
    lines.push('');
  }

  lines.push('⚡ Hành động cần thiết:');
  lines.push('• Kiểm tra trạng thái với đơn vị vận chuyển');
  lines.push('• Liên hệ seller nếu cần cập nhật');
  lines.push('• Theo dõi để tránh khiếu nại từ khách hàng');

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization (optional: add API key or internal secret check)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.INTERNAL_JOB_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trackingStateDelegate = (prisma as any).fulfillmentTrackingState;

    if (!trackingStateDelegate) {
      throw Object.assign(
        new Error('Fulfillment tracking model is not available. Run prisma generate to update the client.'),
        { status: 500 }
      );
    }

    // Get all active organizations with Telegram config
    const orgsWithTelegram = await prisma.organizationTelegramConfig.findMany({
      where: { isActive: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (orgsWithTelegram.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations with active Telegram configuration',
        processedOrgs: 0,
        executionTimeMs: Date.now() - startTime,
      });
    }

    const results: Array<{
      orgId: string;
      orgName: string;
      warning: number;
      critical: number;
      notificationSent: boolean;
      error?: string;
    }> = [];

    for (const config of orgsWithTelegram) {
      const orgId = config.organization.id;
      const orgName = config.organization.name;

      try {
        // Fetch all PROCESSING tracking states for this org
        const states = await trackingStateDelegate.findMany({
          where: {
            orgId,
            status: { equals: 'PROCESSING', mode: 'insensitive' },
          },
          select: {
            trackingNumber: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            shop: {
              select: {
                shopName: true,
                managedName: true,
              },
            },
            order: {
              select: {
                orderId: true,
              },
            },
          },
        });

        const now = new Date();
        const warningStates: TrackingStateDetail[] = [];
        const criticalStates: TrackingStateDetail[] = [];

        states.forEach((state: TrackingStateDetail) => {
          const referenceDate = state.updatedAt ?? state.createdAt;
          if (!referenceDate) {
            return;
          }

          const days = differenceInCalendarDays(now, referenceDate);

          if (Number.isNaN(days)) {
            return;
          }

          if (days >= 10) {
            criticalStates.push(state);
          } else if (days >= 8) {
            warningStates.push(state);
          }
        });

        const warning = warningStates.length;
        const critical = criticalStates.length;

        // Only send notification if there are issues
        let notificationSent = false;
        if (warning > 0 || critical > 0) {
          try {
            const message = buildTrackingAlertMessage({
              orgName,
              warningCount: warning,
              criticalCount: critical,
              warningStates,
              criticalStates,
            });

            await sendTelegramMessage({
              botToken: config.botToken,
              chatId: config.chatId,
              text: message,
            });

            notificationSent = true;
          } catch (notifyError) {
            console.error(`Failed to send Telegram notification for org ${orgId}:`, notifyError);
            results.push({
              orgId,
              orgName,
              warning,
              critical,
              notificationSent: false,
              error: notifyError instanceof Error ? notifyError.message : 'Unknown error',
            });
            continue;
          }
        }

        results.push({
          orgId,
          orgName,
          warning,
          critical,
          notificationSent,
        });
      } catch (orgError) {
        console.error(`Error processing org ${orgId}:`, orgError);
        results.push({
          orgId,
          orgName,
          warning: 0,
          critical: 0,
          notificationSent: false,
          error: orgError instanceof Error ? orgError.message : 'Unknown error',
        });
      }
    }

    const totalWarnings = results.reduce((sum, r) => sum + r.warning, 0);
    const totalCritical = results.reduce((sum, r) => sum + r.critical, 0);
    const notificationsSent = results.filter((r) => r.notificationSent).length;

    return NextResponse.json({
      success: true,
      processedOrgs: results.length,
      totalWarnings,
      totalCritical,
      notificationsSent,
      results,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('Error in tracking-alerts job:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    const message = typeof error?.message === 'string' ? error.message : 'Failed to process tracking alerts';
    return NextResponse.json(
      {
        success: false,
        error: message,
        executionTimeMs: Date.now() - startTime,
      },
      { status }
    );
  } finally {
    await prisma.$disconnect();
  }
}
