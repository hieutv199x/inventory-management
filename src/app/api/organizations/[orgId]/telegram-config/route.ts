import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserWithShopAccess } from "@/lib/auth";
import { getActiveMembership, SUPER_ADMIN_ROLE } from "@/lib/org-permissions";

const prisma = new PrismaClient();

type RouteContext = {
    params: Promise<{
        orgId: string;
    }>;
};

async function authorize(request: NextRequest, orgId: string) {
    const { user } = await getUserWithShopAccess(request, prisma);
    if (user.role === SUPER_ADMIN_ROLE) {
        return { user, membershipRole: SUPER_ADMIN_ROLE };
    }

    const membership = await getActiveMembership(prisma, user.id, orgId);
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        const err: any = new Error('FORBIDDEN');
        err.status = 403;
        throw err;
    }

    return { user, membershipRole: membership.role };
}

function serializeConfig(config: any) {
    if (!config) return null;
    return {
        botToken: config.botToken,
        chatId: config.chatId,
        isActive: config.isActive,
        updatedAt: config.updatedAt,
        createdAt: config.createdAt,
    };
}

export async function GET(request: NextRequest, context: RouteContext) {
    const { orgId } = await context.params;
    try {
        await authorize(request, orgId);
        const config = await prisma.organizationTelegramConfig.findUnique({
            where: { orgId }
        });
        return NextResponse.json({ data: serializeConfig(config) });
    } catch (error: any) {
        const status = error?.status || 500;
        const message = error?.message || 'Failed to load Telegram configuration';
        return NextResponse.json({ error: message }, { status });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    const { orgId } = await context.params;
    try {
        await authorize(request, orgId);
        const body = await request.json();
        const botToken = body?.botToken?.trim?.();
        const chatId = body?.chatId?.trim?.();
        const isActive = typeof body?.isActive === 'boolean' ? body.isActive : true;

        if (!botToken || !chatId) {
            return NextResponse.json({ error: 'botToken and chatId are required' }, { status: 400 });
        }

        const upserted = await prisma.organizationTelegramConfig.upsert({
            where: { orgId },
            update: {
                botToken,
                chatId,
                isActive,
            },
            create: {
                orgId,
                botToken,
                chatId,
                isActive,
            }
        });

        return NextResponse.json({ data: serializeConfig(upserted) });
    } catch (error: any) {
        const status = error?.status || 500;
        const message = error?.message || 'Failed to save Telegram configuration';
        return NextResponse.json({ error: message }, { status });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    return PUT(request, context);
}
