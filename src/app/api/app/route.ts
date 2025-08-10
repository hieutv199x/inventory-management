import {NextRequest, NextResponse} from "next/server";
import {checkRole, validateToken} from "@/lib/auth-middleware";
import {prisma} from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Validate token and get user
        const authResult = await validateToken(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        if (!['ADMIN'].includes(user.role)) {
            return NextResponse.json(
                { message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Admin/Manager can see all shops
        const app = await prisma.tikTokApp.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                appName: 'asc'
            }
        });

        return NextResponse.json({ app });
    } catch (error) {
        console.error('Error fetching app:', error);
        return NextResponse.json(
            { error: 'Failed to fetch app' },
            { status: 500 }
        );
    }
}
