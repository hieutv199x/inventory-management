#!/usr/bin/env ts-node
/**
 * Backfill script to create a default organization and assign orgId across existing records.
 * Run AFTER deploying schema changes (orgId nullable) and before making orgId required.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting organization backfill...');
  const existingDefault = await prisma.organization.findFirst({ where: { slug: 'primary' } });
  const org = existingDefault || await prisma.organization.create({ data: { name: 'Primary Organization', slug: 'primary' } });
  console.log('Using organization:', org.id);

  // Add all users as OWNER members if not already
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId: org.id, userId: u.id } },
      update: {},
      create: { orgId: org.id, userId: u.id, role: 'OWNER' }
    });
  }
  console.log('Ensured membership for', users.length, 'users');

  const FORCE_ALL = process.env.FORCE_ALL === '1';
  if (!FORCE_ALL) {
    console.error('Refusing to overwrite orgId for ALL records without confirmation. Re-run with FORCE_ALL=1 to proceed.');
    return;
  }

  const targets: Array<[string,string]> = [
    ['ShopAuthorization','shopAuthorization'],
    ['Product','product'],
    ['BankAccount','bankAccount'],
    ['BankHistory','bankHistory'],
    ['Payment','payment'],
    ['Statement','statement'],
    ['Withdrawal','withdrawal'],
    ['Order','order'],
    ['OrderLineItem','orderLineItem'],
    ['OrderPackage','orderPackage'],
    ['Conversation','conversation'],
    ['ConversationMessage','conversationMessage'],
    ['Notification','notification'],
    ['TikTokTransaction','tikTokTransaction'],
    ['TiktokUnsettledTransaction','tiktokUnsettledTransaction'],
    ['SchedulerJob','schedulerJob'],
    ['JobExecution','jobExecution'],
    ['JobLog','jobLog'],
    ['TikTokWebhook','tikTokWebhook'],
    ['AuditLog','auditLog']
  ];

  for (const [label, delegateName] of targets) {
    const delegate: any = (prisma as any)[delegateName];
    if (!delegate) { console.warn(`Skip ${label}: delegate not found`); continue; }
    try {
      const before = await delegate.count();
      const res = await delegate.updateMany({ data: { orgId: org.id } });
      console.log(`${label}: set orgId for ${res.count} records (total ${before}).`);
    } catch (e:any) {
      console.error(`${label}: failed ->`, e.message);
    }
  }

  console.log('Forced orgId overwrite complete.');

  console.log('Backfill complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
