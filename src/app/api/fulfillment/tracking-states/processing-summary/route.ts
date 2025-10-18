import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { differenceInCalendarDays } from 'date-fns';

import { getUserWithShopAccess } from '@/lib/auth';
import { requireOrg, resolveOrgContext } from '@/lib/tenant-context';

const prisma = new PrismaClient();

interface SummaryResult {
  warning: number;
  critical: number;
}

export async function GET(request: NextRequest) {
  try {
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

    const { accessibleShopIds, isAdmin } = await getUserWithShopAccess(request, prisma, true);

    const { searchParams } = new URL(request.url);
    const shopAuthId = searchParams.get('shopAuthId')?.trim();

    const baseWhere: Record<string, any> = {
      orgId: org.id,
    };

    if (!isAdmin) {
      if (!accessibleShopIds.length) {
        const empty: SummaryResult = { warning: 0, critical: 0 };
        return NextResponse.json({ data: empty });
      }
      baseWhere.shopId = { in: accessibleShopIds };
    }

    if (shopAuthId) {
      const hasAccess = isAdmin || accessibleShopIds.includes(shopAuthId);
      if (!hasAccess) {
        const empty: SummaryResult = { warning: 0, critical: 0 };
        return NextResponse.json({ data: empty });
      }
      baseWhere.shopId = shopAuthId;
    }

    const trackingStateDelegate = (prisma as any).fulfillmentTrackingState;

    if (!trackingStateDelegate) {
      throw Object.assign(
        new Error('Fulfillment tracking model is not available. Run prisma generate to update the client.'),
        { status: 500 }
      );
    }

    const states = await trackingStateDelegate.findMany({
      where: baseWhere,
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const now = new Date();
    let warning = 0;
    let critical = 0;

    states.forEach((state: { status: string | null; createdAt: Date; updatedAt: Date }) => {
      if ((state.status ?? '').toLowerCase() !== 'processing') {
        return;
      }

      const referenceDate = state.updatedAt ?? state.createdAt;
      if (!referenceDate) {
        return;
      }

      const days = differenceInCalendarDays(now, referenceDate);

      if (Number.isNaN(days)) {
        return;
      }

      if (days >= 10) {
        critical += 1;
      } else if (days >= 8) {
        warning += 1;
      }
    });

  const result: SummaryResult = { warning, critical };
  return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error generating processing summary:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    const message = typeof error?.message === 'string' ? error.message : 'Failed to generate processing summary';
    return NextResponse.json({ error: message }, { status });
  } finally {
    await prisma.$disconnect();
  }
}
