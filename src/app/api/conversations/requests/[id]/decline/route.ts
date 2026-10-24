import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const conv = await prisma.conversation.findFirst({
    where: { id: params.id, participants: { some: { id: s.userId } }, status: 'pending', requesterId: { not: s.userId } },
  });
  if (!conv) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });
  await prisma.conversation.delete({ where: { id: conv.id } });
  return NextResponse.json({ ok: true });
}
