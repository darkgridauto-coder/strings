import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const sub = await prisma.subscription.findUnique({ where: { userId_kind: { userId: s.userId, kind: 'pro' } } });
  if (!sub) return NextResponse.json({ ok: false, error: 'No subscription' }, { status: 404 });
  await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled' } });
  return NextResponse.json({ ok: true });
}
