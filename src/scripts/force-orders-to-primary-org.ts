#!/usr/bin/env ts-node
/**
 * Force assign ALL order-related data orgId to the primary organization (slug: primary).
 * This disregards existing mismatches and overwrites current orgId values.
 * Collections affected:
 *  - orders
 *  - order_line_items
 *  - order_packages
 *  - tiktok_unsettled_transactions
 *  - tiktok_transactions (if has orgId)
 *  - notifications (optional flag)
 *  - payments / statements / withdrawals (optional flag)
 *
 * Usage:
 *   npm run force:orders-primary -- --force
 *   npm run force:orders-primary -- --force --include-financial --include-notifications
 */
import { PrismaClient } from '@prisma/client';
import { MongoClient, ObjectId } from 'mongodb';

interface Flags {
  force: boolean;
  includeFinancial: boolean;
  includeNotifications: boolean;
}

function parseFlags(): Flags {
  const args = process.argv.slice(2);
  const f: Flags = { force: false, includeFinancial: false, includeNotifications: false };
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    if (a === '--force') f.force = true;
    else if (a === '--include-financial') f.includeFinancial = true;
    else if (a === '--include-notifications') f.includeNotifications = true;
  }
  if (process.env.FORCE_WRITE === '1') f.force = true;
  return f;
}

async function getPrimaryOrg(prisma: PrismaClient) {
  let org = await prisma.organization.findFirst({ where: { slug: 'primary' } });
  if (!org) {
    org = await prisma.organization.create({ data: { slug: 'primary', name: 'Primary Organization' } });
  }
  return org;
}

async function bulkSetOrgId(collName: string, targetOrgId: ObjectId, client: MongoClient) {
  const dbName = (client.options as any).dbName || client.db().databaseName;
  const db = client.db(dbName);
  const coll = db.collection(collName);
  const res = await coll.updateMany({}, { $set: { orgId: targetOrgId } });
  return { collection: collName, matched: res.matchedCount, modified: res.modifiedCount };
}

async function main() {
  const flags = parseFlags();
  const prisma = new PrismaClient();
  const org = await getPrimaryOrg(prisma);
  console.log('Primary org:', org.id);
  if (!flags.force) {
    console.log('Dry run (no write). Use --force or FORCE_WRITE=1 to apply changes.');
  }
  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) throw new Error('DATABASE_URL not set');
  const mclient = new MongoClient(mongoUrl, { });
  await mclient.connect();
  const target = new ObjectId(org.id);

  const coreCollections = [
    'orders',
    'order_line_items',
    'order_packages',
    'tiktok_unsettled_transactions',
    'tiktok_transactions'
  ];
  const optionalFinancial = [ 'payments', 'statements', 'withdrawals' ];
  const optionalNotifications = [ 'notifications' ];

  const all = [
    ...coreCollections,
    ...(flags.includeFinancial ? optionalFinancial : []),
    ...(flags.includeNotifications ? optionalNotifications : [])
  ];

  const results: any[] = [];
  if (flags.force) {
    for (const c of all) {
      try {
        const r = await bulkSetOrgId(c, target, mclient);
        results.push(r);
        console.log('Updated', c, r);
      } catch (e:any) {
        console.error('Failed updating', c, e.message);
      }
    }
  } else {
    // In dry-run just count documents & estimate how many have different orgId
    const db = mclient.db();
    for (const c of all) {
      const total = await db.collection(c).countDocuments();
      const diff = await db.collection(c).countDocuments({ orgId: { $ne: target } });
      results.push({ collection: c, total, diff });
      console.log(`[dry-run] ${c}: total=${total} diffFromTarget=${diff}`);
    }
  }

  await mclient.close();
  await prisma.$disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
