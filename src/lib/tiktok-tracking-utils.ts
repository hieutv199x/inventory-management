import { PrismaClient } from "@prisma/client";

export const NEGATIVE_TRACKING_KEYWORDS = [
    "couldn't be delivered",
    "could not be delivered",
    "unable to deliver",
    "failed to deliver",
    "delivery failed",
    "delivery attempt failed",
    "delivery attempt was unsuccessful",
    "undeliverable",
    "return to sender",
    "returned to sender",
    "returning to sender",
    "package returned to sender",
    "lost in transit",
    "package lost",
    "delivery exception",
    "package damaged",
    "damaged in transit",
    "package could not be delivered"
];

export function extractTrackingDescription(event: any): string {
    if (!event || typeof event !== "object") {
        return "";
    }

    const possibleKeys = ["description", "statusDescription", "status_description", "message", "detail"];
    for (const key of possibleKeys) {
        const value = (event as any)[key];
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }

    return "";
}

export function isNegativeTrackingDescription(description: string): boolean {
    if (!description) {
        return false;
    }

    const normalized = description.toLowerCase();
    return NEGATIVE_TRACKING_KEYWORDS.some(keyword => normalized.includes(keyword));
}

export function trackingEventsIndicateProblem(trackingEvents: any[] | undefined | null): boolean {
    if (!Array.isArray(trackingEvents)) {
        return false;
    }

    return trackingEvents.some(event => {
        const description = extractTrackingDescription(event);
        return description ? isNegativeTrackingDescription(description) : false;
    });
}

export async function markOrderAsProblemInTransit(prisma: PrismaClient, orderId: string): Promise<void> {
    try {
        const result = await prisma.order.updateMany({
            where: {
                id: orderId,
                OR: [
                    { isProblemInTransit: { equals: false } },
                    { isProblemInTransit: { equals: null } }
                ]
            },
            data: { isProblemInTransit: true }
        });

        if (result.count > 0) {
            console.log(`Marked order ${orderId} as problem in transit due to tracking event`);
        }
    } catch (error) {
        console.warn(`Failed to flag order ${orderId} as problem in transit:`, error);
    }
}

export function prepareTrackingEventRecords(orderId: string, trackingEvents: any[]): { orderId: string; description: string; updateTimeMilli: number }[] {
    return trackingEvents
        .filter(event => event && typeof event === "object")
        .map(event => {
            const updateMillisSource = (event as any).update_time_millis
                ?? (event as any).updateTimeMillis
                ?? (event as any).update_time
                ?? (event as any).updateTime
                ?? 0;
            const updateMillis = Number(updateMillisSource) || 0;
            return {
                orderId,
                description: String((event as any).description ?? extractTrackingDescription(event) ?? ""),
                updateTimeMilli: updateMillis
            };
        })
        .filter(event => typeof event.description === "string" && event.description.length > 0);
}
