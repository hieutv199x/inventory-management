import type { PrismaClient } from "@prisma/client";

const TELEGRAM_API_BASE = "https://api.telegram.org";

interface NewOrderTelegramPayload {
    orgId: string;
    orderId: string;
    status?: string | null;
    totalAmount?: string | number | null;
    currency?: string | null;
    buyerName?: string | null;
    buyerEmail?: string | null;
    shopName?: string | null;
    channel?: string | null;
    createdAt?: number | null; // epoch seconds from TikTok
    lineItems?: Array<{
        productName?: string | null;
        quantity?: number | null;
        salePrice?: string | number | null;
    }>;
}

export async function notifyNewOrderViaTelegram(
    prisma: PrismaClient,
    payload: NewOrderTelegramPayload
): Promise<void> {
    if (!payload.orgId) {
        return;
    }

    const config = await prisma.organizationTelegramConfig.findUnique({
        where: { orgId: payload.orgId }
    });

    if (!config || !config.isActive) {
        return;
    }

    const message = buildNewOrderMessage(payload);

    try {
        await sendTelegramMessage({
            botToken: config.botToken,
            chatId: config.chatId,
            text: message
        });
    } catch (error) {
        console.warn(`Failed to send Telegram notification for order ${payload.orderId}:`, error);
    }
}

async function sendTelegramMessage(params: { botToken: string; chatId: string; text: string }): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${params.botToken}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: params.chatId,
            text: params.text,
            disable_web_page_preview: true
        })
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "<unable to parse error body>");
        throw new Error(`Telegram API responded with ${response.status}: ${errorBody}`);
    }
}

function buildNewOrderMessage(payload: NewOrderTelegramPayload): string {
    const lines: string[] = [];
    lines.push(`🛒 Có đơn hàng mới`);
    lines.push(`Mã đơn hàng: ${payload.orderId}`);

    if (payload.shopName) {
        lines.push(`Cửa hàng: ${payload.shopName}`);
    }

    if (payload.channel) {
        lines.push(`Kênh: ${payload.channel}`);
    }

    const buyer = payload.buyerName || payload.buyerEmail;
    if (buyer) {
        lines.push(`Khách hàng: ${buyer}`);
    }

    const formattedTotal = formatCurrency(payload.totalAmount, payload.currency);
    if (formattedTotal) {
        lines.push(`Tổng đơn: ${formattedTotal}`);
    }

    if (payload.status) {
        lines.push(`Trạng thái: ${payload.status}`);
    }

    if (payload.createdAt) {
        lines.push(`Tạo lúc: ${formatTimestamp(payload.createdAt)}`);
    }

    const topLineItems = (payload.lineItems || []).slice(0, 3);
    if (topLineItems.length > 0) {
        lines.push("Sản phẩm:");
        for (const item of topLineItems) {
            const quantity = item.quantity ?? 1;
            const price = formatCurrency(item.salePrice, payload.currency);
            const parts = [] as string[];
            parts.push(`${quantity} × ${item.productName ?? "Không xác định"}`);
            if (price) {
                parts.push(price);
            }
            lines.push(` • ${parts.join(" • ")}`);
        }
        if ((payload.lineItems?.length || 0) > topLineItems.length) {
            const remaining = payload.lineItems!.length - topLineItems.length;
            lines.push(` • …và thêm ${remaining} sản phẩm khác`);
        }
    }

    return lines.join("\n");
}

function formatCurrency(amount: string | number | null | undefined, currency?: string | null): string | null {
    const numericAmount = typeof amount === "string" ? Number(amount) : amount;
    if (!numericAmount || Number.isNaN(numericAmount)) {
        return null;
    }
    const currencyCode = currency ?? "USD";
    try {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: 2
        }).format(numericAmount);
    } catch (error) {
        console.warn(`Failed to format currency ${numericAmount} ${currencyCode}:`, error);
        return `${numericAmount} ${currencyCode}`;
    }
}

function formatTimestamp(epochSeconds: number): string {
    try {
        const date = new Date(epochSeconds * 1000);
        return date.toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour12: false
        });
    } catch (error) {
        console.warn(`Failed to format timestamp ${epochSeconds}:`, error);
        return String(epochSeconds);
    }
}
