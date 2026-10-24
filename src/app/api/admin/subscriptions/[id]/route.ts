import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const sub = await prisma.subscription.findUnique({ where: { id: params.id }, include: { user: { select: { handle: true } } } });
  if (!sub) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  await prisma.subscription.update({ where: { id: params.id }, data: { status: 'cancelled' } });
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Cancelled subscription', target: `@${sub.user.handle} · ${sub.kind}/${sub.plan}`, detail: '' },
  });
  return NextResponse.json({ ok: true });
}
