import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const [verifications, subscription] = await Promise.all([
    prisma.verification.findMany({ where: { userId: s.userId } }),
    prisma.subscription.findUnique({ where: { userId_kind: { userId: s.userId, kind: 'verify' } } }),
  ]);
  const anyVerified = verifications.find((v) => v.status === 'verified');
  return NextResponse.json({
    ok: true,
    verifications,
    subscription,
    verifiedTier: anyVerified ? anyVerified.tier : null,
  });
}
