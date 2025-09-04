import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { user, isAdmin } = await getUserWithShopAccess(request, prisma);

        // Check permissions - only Owner and Accountant roles
        if (!isAdmin && user.role !== 'ACCOUNTANT') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const body = await request.json();
        const { status, notes } = body;
        const alertId = params.id;

        // For this implementation, we'll just return success since we're not storing alerts in DB
        // In a real implementation, you might want to store reviewed status somewhere
        
        return NextResponse.json({
            message: 'Alert marked as reviewed',
            alertId,
            status,
            reviewedBy: user.id,
            reviewedAt: Date.now(),
            notes
        });

    } catch (error) {
        console.error('Error updating fraud alert:', error);
        return NextResponse.json(
            { error: 'Failed to update fraud alert' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
