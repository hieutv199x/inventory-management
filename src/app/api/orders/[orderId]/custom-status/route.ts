import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../prisma/client';
import { resolveOrgContext, requireOrg } from '@/lib/tenant-context';

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

        // Resolve active organization (multi-tenant safety)
    const orgResult = await resolveOrgContext(request, prisma);
    const org = requireOrg(orgResult);

        // Find the order within org scope first to get its internal id
        const existing = await prisma.order.findFirst({
            where: {
                orderId,
                orgId: org.id
            },
            select: { id: true }
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Update using primary key id (avoid any implicit transaction / failing unique lookup edge cases)
        const updatedOrder = await prisma.order.update({
            where: { id: existing.id },
            data: { customStatus }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Custom status updated successfully',
            order: updatedOrder
        });

    } catch (error: any) {
        console.error('Error updating custom status:', error);
        if (error.code === 'P2010') {
            return NextResponse.json(
                { error: 'Database deployment does not support transactions / encountered low-level error', details: error.meta },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update custom status' },
            { status: 500 }
        );
    }
}
