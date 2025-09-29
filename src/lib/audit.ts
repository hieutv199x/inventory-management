import { PrismaClient } from '@prisma/client';

// Minimal audit logging helper. For now it writes into a generic collection via Prisma using a model we will add later (AuditLog).
// If the model does not yet exist, this will be a no-op safeguard so we can roll out incrementally.

export interface AuditEventInput {
  orgId: string;
  userId?: string;
  action: string; // e.g. PAYMENT_LIST, WITHDRAWAL_LIST, LIMIT_BLOCK
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  level?: 'INFO' | 'WARN' | 'ERROR';
}

export async function audit(prisma: PrismaClient, evt: AuditEventInput) {
  try {
    // Attempt to create audit log if model exists
    // @ts-ignore - conditional runtime check
    if ((prisma as any).auditLog) {
      await (prisma as any).auditLog.create({
        data: {
          orgId: evt.orgId,
            userId: evt.userId || null,
            action: evt.action,
            entityId: evt.entityId || null,
            entityType: evt.entityType || null,
            metadata: evt.metadata ? JSON.stringify(evt.metadata) : null,
            level: evt.level || 'INFO'
        }
      });
    } else {
      // Fallback: write to console so we retain visibility until migration is added
      console.debug('[AUDIT:FALLBACK]', evt.action, { org: evt.orgId, user: evt.userId, meta: evt.metadata });
    }
  } catch (err) {
    console.warn('Audit log failed', err);
  }
}
