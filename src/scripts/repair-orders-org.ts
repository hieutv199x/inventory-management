#!/usr/bin/env ts-node
/**
 * Repair script: ensure all Order + related order-scoped collections have a valid orgId.
 * Strategy:
 * 1. Load (or create) default org (slug: 'primary') unless --org <slug> provided.
 * 2. For orders where orgId is missing OR does not match its shopAuthorization.orgId (if shop has one), fix it.
 * 3. Optionally cascade to OrderLineItem / OrderPackage if --cascade specified.
 * 4. Dry-run by default; require FORCE_WRITE=1 to persist.
 */
import { PrismaClient } from '@prisma/client';
import { MongoClient, ObjectId } from 'mongodb';

const prisma = new PrismaClient();

interface Args { orgSlug?: string; cascade: boolean; force: boolean; }

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const parsed: Args = { cascade: false, force: false };
  for (let i=0;i<args.length;i++) {
    const a = args[i];
    if (a === '--org' && args[i+1]) { parsed.orgSlug = args[++i]; }
    else if (a === '--cascade') parsed.cascade = true;
    else if (a === '--force' || a === 'FORCE_WRITE=1') parsed.force = true;
  }
  if (process.env.FORCE_WRITE === '1') parsed.force = true;
  return parsed;
}

async function ensureOrg(slug?: string) {
  if (slug) {
    let org = await prisma.organization.findFirst({ where: { slug } });
    if (!org) org = await prisma.organization.create({ data: { slug, name: slug.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) } });
    return org;
  }
  let existing = await prisma.organization.findFirst({ where: { slug: 'primary' } });
  if (existing) return existing;
  return prisma.organization.create({ data: { name: 'Primary Organization', slug: 'primary' } });
}

async function main() {
  const args = parseArgs();
  const org = await ensureOrg(args.orgSlug);
  console.log(`Using target organization: ${org.slug} (${org.id})`);

  console.log('Scanning orders for orgId inconsistencies (raw driver to bypass null constraint)...');
  const mongoUrl = process.env.DATABASE_URL;
  if (!mongoUrl) throw new Error('DATABASE_URL not set');
  const mclient = new MongoClient(mongoUrl);
  await mclient.connect();
  const dbName = mongoUrl.split('/').pop()!.split('?')[0];
  const db = mclient.db(dbName);
  const ordersColl = db.collection('orders');
  const shopsColl = db.collection('shop_authorizations');

  const cursor = ordersColl.find({}, { projection: { _id: 1, orgId: 1, orderId: 1, shopId: 1 } });
  const toFix: Array<{ id: string; currentOrgId: any; expectedOrgId: string; reason: string; shopId: any; orderId: any; }> = [];
  while (await cursor.hasNext()) {
    const doc: any = await cursor.next();
    const shop = doc.shopId ? await shopsColl.findOne({ _id: doc.shopId }) : null;
    const shopOrg = shop?.orgId ? String(shop.orgId) : undefined;
    const current = doc.orgId ? String(doc.orgId) : null;
    let expected: string | undefined;
    let reason: string | null = null;
    if (!current) { expected = shopOrg || org.id; reason = 'missing'; }
    else if (shopOrg && current !== shopOrg) { expected = shopOrg; reason = 'mismatch_shop'; }
    else if (!shopOrg && current !== org.id) { expected = org.id; reason = 'fallback_default'; }
    if (expected && reason) {
      toFix.push({ id: String(doc._id), currentOrgId: current, expectedOrgId: expected, reason, shopId: doc.shopId, orderId: doc.orderId });
    }
  }
  await mclient.close();
  
  console.log(`Found ${toFix.length} orders needing correction.`);

  if (!args.force) {
    console.log('Dry run (no changes). Re-run with --force or FORCE_WRITE=1 to apply.');
    if (toFix.length) {
      console.log('Sample fixes:', toFix.slice(0,10));
    }
  } else if (toFix.length) {
    console.log('Applying order orgId fixes...');
    // Use raw bulkWrite to tolerate previously null orgId states
    const bulkOps = toFix.map(f => ({ updateOne: { filter: { _id: new ObjectId(f.id) }, update: { $set: { orgId: new ObjectId(f.expectedOrgId) } } } }));
    const mongoUrl2 = process.env.DATABASE_URL as string;
    const mclient2 = new MongoClient(mongoUrl2); await mclient2.connect();
    const db2 = mclient2.db(mongoUrl2.split('/').pop()!.split('?')[0]);
    const ordersColl2 = db2.collection('orders');
    const res = await ordersColl2.bulkWrite(bulkOps, { ordered: false });
    console.log('Bulk write result:', { matched: res.matchedCount, modified: res.modifiedCount });
    await mclient2.close();
    console.log('Order orgId updates applied.');
  }

  if (args.cascade && args.force) {
    console.log('Cascading fix to OrderLineItem / OrderPackage where mismatch.');
    const fixChildren = async (model: 'orderLineItem' | 'orderPackage') => {
      const delegate: any = (prisma as any)[model];
      if (!delegate) return;
      let cursor: string | undefined;
      const page = 500;
      while (true) {
        const children = await delegate.findMany({
          take: page,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          select: { id: true, orgId: true, orderId: true, order: { select: { orgId: true } } }
        });
        if (!children.length) break;
        for (const c of children) {
          const expected = (c.order as any)?.orgId;
          if (expected && c.orgId !== expected) {
            await delegate.update({ where: { id: c.id }, data: { orgId: expected } });
          }
        }
        cursor = children[children.length - 1].id;
      }
    };
    await fixChildren('orderLineItem');
    await fixChildren('orderPackage');
    console.log('Cascade complete.');
  }

  console.log('Repair complete.');
}

function chunkArray<T>(arr: T[], size: number): T[][] { const out: T[][] = []; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; }

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
