import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handle = (process.argv[2] || '').replace(/^@/, '').trim().toLowerCase();

if (!handle) {
  console.error('Usage: node scripts/make-admin.mjs <handle>');
  console.error('Example: node scripts/make-admin.mjs emmanuel_okiki');
  const users = await prisma.user.findMany({ select: { handle: true, email: true, role: true }, take: 20, orderBy: { createdAt: 'desc' } });
  console.error('\nRecent users:');
  users.forEach(u => console.error(`  @${u.handle} · ${u.email} · ${u.role}`));
  await prisma.$disconnect();
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { handle } });
if (!user) {
  console.error(`✗ User @${handle} not found.`);
  const all = await prisma.user.findMany({ select: { handle: true, email: true }, take: 20, orderBy: { createdAt: 'desc' } });
  console.error('Recent users:');
  all.forEach(u => console.error(`  @${u.handle} · ${u.email}`));
  await prisma.$disconnect();
  process.exit(1);
}

// Promote to admin AND grant Professional seal
await prisma.$transaction([
  prisma.user.update({ where: { handle }, data: { role: 'admin', verifiedTier: 'professional' } }),
  prisma.verification.upsert({
    where: { userId_tier: { userId: user.id, tier: 'professional' } },
    create: { userId: user.id, tier: 'professional', status: 'verified', reviewedAt: new Date() },
    update: { status: 'verified', reviewedAt: new Date() },
  }),
]);

console.log(`✔ @${user.handle} (${user.email}) is now an admin with a Professional verification seal.`);
console.log('  Sign out and back in, or reload any page.');
await prisma.$disconnect();
