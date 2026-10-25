import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const status = await prisma.status.findUnique({ where: { id: params.id } });
  if (!status) return NextResponse.json({ ok: false }, { status: 404 });
  if (status.userId === s.userId) return NextResponse.json({ ok: true, skipped: 'own-status' });
  await prisma.statusView.upsert({
    where: { statusId_viewerId: { statusId: params.id, viewerId: s.userId } },
    create: { statusId: params.id, viewerId: s.userId },
    update: { viewedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
