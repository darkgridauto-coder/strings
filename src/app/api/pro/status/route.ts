import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const sub = await prisma.subscription.findUnique({ where: { userId_kind: { userId: s.userId, kind: 'pro' } } });
  return NextResponse.json({ ok: true, subscription: sub, active: sub?.status === 'active' });
}
