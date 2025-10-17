import type { PrismaClient } from "@prisma/client";

const DEFAULT_TRACKING_BATCH_URL = process.env.TRACKING_SERVICE_BATCH_URL ?? "http://127.0.0.1:8000/track/batch";
const DEFAULT_TRACKING_TIMEOUT_MS = Number.parseInt(process.env.TRACKING_SERVICE_TIMEOUT_MS ?? "5000", 10);

export interface PackageTrackingSyncPayload {
  orderId: string;
  orgId?: string | null;
  shopId?: string | null;
  orderPackageId?: string | null;
  trackingNumber?: string | null;
  status?: string | null;
  providerName?: string | null;
  providerId?: string | null;
  providerType?: string | null;
  providerServiceLevel?: string | null;
  providerTrackingUrl?: string | null;
  postCode?: string | null;
}

const normalize = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const toProviderSlug = (providerId?: string | null, providerName?: string | null) => {
  const candidate = normalize(providerId) ?? normalize(providerName);
  if (!candidate) return null;
  return candidate.toLowerCase();
};

interface TrackingJob {
  tracking_id: string;
  provider: string;
  post_code?: string;
}

interface TriggerOptions {
  jobs: TrackingJob[];
}

async function triggerTrackingService({ jobs }: TriggerOptions) {
  const url = DEFAULT_TRACKING_BATCH_URL;
  if (!url) {
    console.warn("Tracking service URL not configured; skip tracking sync.");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TRACKING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.TRACKING_SERVICE_API_KEY}` },
      body: JSON.stringify({ jobs }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.warn("Tracking service returned non-OK response", {
        status: response.status,
        body: errorBody,
      });
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      console.warn("Tracking service request timed out", { timeoutMs: DEFAULT_TRACKING_TIMEOUT_MS });
    } else {
      console.warn("Failed to call tracking service", error);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Upserts a fulfillment tracking state for the provided package information and
 * notifies the external tracking service. Missing critical data (orgId, tracking number, shopId)
 * will result in a no-op to avoid partial records.
 */
export async function syncFulfillmentTrackingStateFromPackage(
  prisma: PrismaClient,
  {
    orderId,
    orgId,
    shopId,
    orderPackageId,
    trackingNumber,
    status,
    providerName,
    providerId,
    providerType,
    providerServiceLevel,
    providerTrackingUrl,
    postCode,
  }: PackageTrackingSyncPayload
) {
  const normalizedTrackingNumber = normalize(trackingNumber);
  if (!normalizedTrackingNumber) {
    return;
  }

  if (!orgId) {
    console.warn("Cannot sync fulfillment tracking without orgId", { orderId });
    return;
  }

  let resolvedShopId = normalize(shopId);
  let resolvedPostCode = normalize(postCode);

  let orderLookup:
    | {
        shopId?: string | null;
        recipientAddress?: { postalCode?: string | null } | null;
        channelData?: string | null;
      }
    | null = null;

  if (!resolvedShopId || !resolvedPostCode) {
    orderLookup = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        shopId: true,
        recipientAddress: { select: { postalCode: true } },
        channelData: true,
      },
    });
  }

  if (!resolvedShopId) {
    resolvedShopId = normalize(orderLookup?.shopId);
  }

  if (!resolvedPostCode) {
    resolvedPostCode = normalize(orderLookup?.recipientAddress?.postalCode);
    if (!resolvedPostCode && orderLookup?.channelData) {
      try {
        const parsed = JSON.parse(orderLookup.channelData);
        resolvedPostCode = normalize(
          parsed?.recipientAddress?.postalCode ?? parsed?.postalCode ?? parsed?.recipient?.postalCode ?? null
        );
      } catch (error) {
        console.warn("Failed to parse order channelData for postal code", { orderId, error });
      }
    }
  }

  if (!resolvedShopId) {
    console.warn("Cannot sync fulfillment tracking without shopId", { orderId });
    return;
  }

  const data = {
    orderId,
    orderPackageId: orderPackageId ?? null,
    shopId: resolvedShopId,
    trackingNumber: normalizedTrackingNumber,
    providerName: providerName ?? null,
    providerType: providerType ?? null,
    providerServiceLevel: providerServiceLevel ?? null,
    providerTrackingUrl: providerTrackingUrl ?? null,
    status: status ?? null,
    orgId,
  };

  try {
    await prisma.fulfillmentTrackingState.upsert({
      where: {
        orderId_trackingNumber: {
          orderId,
          trackingNumber: normalizedTrackingNumber,
        },
      },
      update: data,
      create: data,
    });
  } catch (error) {
    console.error("Failed to upsert fulfillment tracking state", {
      orderId,
      trackingNumber: normalizedTrackingNumber,
      error,
    });
    return;
  }

  const providerSlug = toProviderSlug(providerId, providerName);
  if (!providerSlug) {
    return;
  }

  const job: TrackingJob = {
    tracking_id: normalizedTrackingNumber,
    provider: providerName?.toLocaleLowerCase() || providerSlug,
  };

  if (resolvedPostCode) {
    job.post_code = resolvedPostCode;
  }

  await triggerTrackingService({
    jobs: [job],
  });
}

export async function triggerTrackingForOrders(
  prisma: PrismaClient,
  orderIds: string[]
) {
  if (!orderIds.length) {
    return;
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true,
      shopId: true,
      channelData: true,
      recipientAddress: {
        select: {
          postalCode: true,
        },
      },
      packages: {
        select: {
          trackingNumber: true,
          shippingProviderId: true,
          shippingProviderName: true,
        },
      },
    },
  });

  const jobs: TrackingJob[] = [];
  const seenJobs = new Set<string>();

  for (const order of orders) {
    const trackingNumbers = new Set<string>();
    let parsedChannelData: any = null;

    if (order.channelData) {
      try {
        parsedChannelData = JSON.parse(order.channelData);
      } catch (error) {
        console.warn("Failed to parse order channelData for tracking", { orderId: order.id, error });
        parsedChannelData = null;
      }
    }

    const orderPostalCode =
      normalize(order.recipientAddress?.postalCode) ??
      normalize(
        parsedChannelData?.recipientAddress?.postalCode ??
          parsedChannelData?.postalCode ??
          parsedChannelData?.recipient?.postalCode ??
          null
      );

    for (const pkg of order.packages) {
      const normalized = normalize(pkg.trackingNumber);
      if (!normalized || trackingNumbers.has(normalized)) continue;

      const providerSlug = toProviderSlug(pkg.shippingProviderId, pkg.shippingProviderName);
      if (!providerSlug) continue;

      const key = `${normalized}|${providerSlug}`;
      if (seenJobs.has(key)) continue;

      seenJobs.add(key);

      trackingNumbers.add(normalized);
      const job: TrackingJob = {
        tracking_id: normalized,
        provider: pkg.shippingProviderName?.toLocaleLowerCase() || providerSlug,
      };

      if (orderPostalCode) {
        job.post_code = orderPostalCode;
      }

      jobs.push(job);
    }

    if (trackingNumbers.size === 0 && parsedChannelData) {
      const fallbackTracking = normalize(parsedChannelData?.trackingNumber);
      const providerSlug = toProviderSlug(
        parsedChannelData?.shippingProviderId,
        parsedChannelData?.shippingProvider
      );

      if (fallbackTracking && providerSlug && !trackingNumbers.has(fallbackTracking)) {
        const key = `${fallbackTracking}|${providerSlug}`;
        if (!seenJobs.has(key)) {
          seenJobs.add(key);
          trackingNumbers.add(fallbackTracking);
          const job: TrackingJob = {
            tracking_id: fallbackTracking,
            provider: providerSlug,
          };

          if (orderPostalCode) {
            job.post_code = orderPostalCode;
          }

          jobs.push(job);
        }
      }
    }
  }

  if (!jobs.length) {
    return;
  }

  await triggerTrackingService({ jobs });
}
