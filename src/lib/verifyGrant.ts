import { prisma } from '@/lib/db';

export type VerifyTier = 'identity' | 'professional' | 'organisation';

export async function grantVerifiedTier(userId: string, tier: VerifyTier): Promise<void> {
  await prisma.$transaction([
    prisma.verification.upsert({
      where: { userId_tier: { userId, tier } },
      create: { userId, tier, status: 'verified', reviewedAt: new Date() },
      update: { status: 'verified', reviewedAt: new Date() },
    }),
    prisma.user.update({ where: { id: userId }, data: { verifiedTier: tier } }),
  ]);
}

export async function revokeVerifiedTier(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.verification.updateMany({ where: { userId, status: 'verified' }, data: { status: 'none' } }),
    prisma.user.update({ where: { id: userId }, data: { verifiedTier: '' } }),
  ]);
}

export async function autoGrantAdminTier(userId: string): Promise<void> {
  // Admins display the professional seal by default
  await grantVerifiedTier(userId, 'professional');
}
