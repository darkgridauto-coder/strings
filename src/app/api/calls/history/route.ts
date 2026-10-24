import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const calls = await prisma.call.findMany({
    where: { OR: [{ callerId: s.userId }, { receiverId: s.userId }] },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      caller: { select: { id: true, handle: true, displayName: true, avatar: true } },
      receiver: { select: { id: true, handle: true, displayName: true, avatar: true } },
    },
  });
  return NextResponse.json({ ok: true, calls, meId: s.userId });
}
