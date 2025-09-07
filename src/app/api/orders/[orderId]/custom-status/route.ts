import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;
        const body = await request.json();
        const { customStatus } = body;

        // Validate customStatus
        if (!customStatus || !['START', 'DELIVERED'].includes(customStatus)) {
            return NextResponse.json(
                { error: 'Invalid custom status. Must be START or DELIVERED' },
                { status: 400 }
            );
        }

        // Update the order's custom status in database
        const updatedOrder = await prisma.order.update({
            where: {
                orderId: orderId
            },
            data: {
                customStatus
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Custom status updated successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Error updating custom status:', error);
        return NextResponse.json(
            { error: 'Failed to update custom status' },
            { status: 500 }
        );
    }
}
