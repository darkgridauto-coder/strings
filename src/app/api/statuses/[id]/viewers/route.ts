import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const status = await prisma.status.findUnique({ where: { id: params.id } });
  if (!status) return NextResponse.json({ ok: false }, { status: 404 });
  if (status.userId !== s.userId) return NextResponse.json({ ok: false, error: 'Not your status' }, { status: 403 });
  const views = await prisma.statusView.findMany({
    where: { statusId: params.id },
    orderBy: { viewedAt: 'desc' },
    include: { viewer: { select: { id: true, handle: true, displayName: true, avatar: true } } },
  });
  return NextResponse.json({
    ok: true,
    viewers: views.map((v) => ({ ...v.viewer, viewedAt: v.viewedAt })),
  });
}
