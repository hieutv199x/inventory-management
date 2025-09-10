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

        // Admin/Manager can see all shops
        const app = await prisma.channelApp.findMany({
            where: {
                isActive: true
            },
            include:{
                // Count of shops using this app
                _count: {
                    select: { authorizations: true }
                }
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
