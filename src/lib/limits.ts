import { PrismaClient } from '@prisma/client';
import { findPlan } from './plans';

export interface LimitCheckOptions {
  orgId: string;
  planId?: string | null;
  featureOverrides?: any;
  type: 'shops' | 'members' | 'ordersPerMonth' | string; // allow forward compatibility
  currentUsage?: number; // if provided skip counting query
  countQuery?: () => Promise<number>; // fallback if usage not provided
}

export interface LimitResult {
  allowed: boolean;
  limit: number | null | undefined;
  usage: number;
  remaining: number | null; // null means unlimited
}

export async function enforceLimit(opts: LimitCheckOptions): Promise<LimitResult> {
  const plan = findPlan(opts.planId || undefined);
  const limit = plan?.limits[opts.type];
  let usage = typeof opts.currentUsage === 'number'
    ? opts.currentUsage
    : (opts.countQuery ? await opts.countQuery() : 0);

  if (limit == null) {
    return { allowed: true, limit, usage, remaining: null };
  }

  const allowed = usage < limit;
  return { allowed, limit, usage, remaining: allowed ? (limit - usage) : 0 };
}
