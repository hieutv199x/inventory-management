import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { resolveOrgContext } from '@/lib/tenant-context';
import { getUserWithShopAccess } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Ensure user is authenticated first (re-use existing helper)
    const { user } = await getUserWithShopAccess(req, prisma);
    const result = await resolveOrgContext(req, prisma);
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to resolve organization context' }, { status: e.status || 500 });
  } finally {
    await prisma.$disconnect();
  }
}
