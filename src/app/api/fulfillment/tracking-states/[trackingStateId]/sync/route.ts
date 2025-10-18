import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

import { getUserWithShopAccess } from "@/lib/auth";
import { requireOrg, resolveOrgContext } from "@/lib/tenant-context";
import { syncFulfillmentTrackingStateFromPackage } from "@/lib/fulfillment-tracking";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { trackingStateId: string } }
) {
  try {
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);
    const { accessibleShopIds, isAdmin } = await getUserWithShopAccess(request, prisma, true);

    const trackingStateId = params?.trackingStateId;
    if (!trackingStateId) {
      return NextResponse.json({ error: "Missing tracking state id" }, { status: 400 });
    }

    const trackingState = await prisma.fulfillmentTrackingState.findUnique({
      where: { id: trackingStateId },
      select: {
        id: true,
        orderId: true,
        orderPackageId: true,
        shopId: true,
        orgId: true,
        trackingNumber: true,
        status: true,
        providerName: true,
        providerType: true,
        providerServiceLevel: true,
        providerTrackingUrl: true,
        order: {
          select: {
            id: true,
            channelData: true,
            recipientAddress: {
              select: {
                postalCode: true,
              },
            },
          },
        },
        orderPackage: {
          select: {
            id: true,
            shippingProviderId: true,
          },
        },
      },
    });

    if (!trackingState || trackingState.orgId !== org.id) {
      return NextResponse.json({ error: "Tracking state not found" }, { status: 404 });
    }

    if (!isAdmin && !accessibleShopIds.includes(trackingState.shopId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!trackingState.orderId || !trackingState.trackingNumber) {
      return NextResponse.json({ error: "Tracking state is missing order reference" }, { status: 400 });
    }

    let resolvedPostCode = trackingState.order?.recipientAddress?.postalCode ?? null;

    if (!resolvedPostCode && trackingState.order?.channelData) {
      try {
        const parsed = JSON.parse(trackingState.order.channelData);
        resolvedPostCode =
          parsed?.recipientAddress?.postalCode ??
          parsed?.postalCode ??
          parsed?.recipient?.postalCode ??
          null;
      } catch (error) {
        console.warn("Failed to parse order channelData for postal code", {
          orderId: trackingState.order?.id,
          error,
        });
      }
    }

    await syncFulfillmentTrackingStateFromPackage(prisma, {
      orderId: trackingState.orderId,
      orderPackageId: trackingState.orderPackageId ?? null,
      trackingNumber: trackingState.trackingNumber,
      status: trackingState.status ?? null,
      providerName: trackingState.providerName ?? null,
      providerId: trackingState.orderPackage?.shippingProviderId ?? null,
      providerType: trackingState.providerType ?? null,
      providerServiceLevel: trackingState.providerServiceLevel ?? null,
      providerTrackingUrl: trackingState.providerTrackingUrl ?? null,
      shopId: trackingState.shopId,
      orgId: trackingState.orgId,
      postCode: resolvedPostCode,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to sync fulfillment tracking state:", error);
    const message = error instanceof Error ? error.message : "Failed to sync tracking state";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
