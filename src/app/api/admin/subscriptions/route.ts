import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const subs = await prisma.subscription.findMany({
    orderBy: { startedAt: 'desc' },
    include: { user: { select: { id: true, handle: true, displayName: true } } },
  });
  return NextResponse.json({ ok: true, subscriptions: subs });
}
