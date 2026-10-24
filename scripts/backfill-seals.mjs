import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const verified = await prisma.verification.findMany({ where: { status: 'verified' } });
  let count = 0;
  for (const v of verified) {
    const tier = v.tier;
    try {
      await prisma.user.update({ where: { id: v.userId }, data: { verifiedTier: tier } });
      count++;
    } catch (e) {
      console.error(`Failed for user ${v.userId}:`, e.message);
    }
  }
  console.log(`✔ Backfilled ${count} verified user${count === 1 ? '' : 's'}`);

  // Admins always get professional
  const admins = await prisma.user.findMany({ where: { role: 'admin' } });
  let adminFixed = 0;
  for (const a of admins) {
    if (a.verifiedTier !== 'professional') {
      await prisma.user.update({ where: { id: a.id }, data: { verifiedTier: 'professional' } });
      adminFixed++;
    }
  }
  console.log(`✔ Ensured ${adminFixed} admin${adminFixed === 1 ? '' : 's'} have the professional seal`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
