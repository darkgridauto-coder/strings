import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const requests = await prisma.conversation.findMany({
    where: {
      status: 'pending',
      requesterId: { not: s.userId },
      participants: { some: { id: s.userId } },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: { select: { id: true, handle: true, displayName: true, avatar: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  });
  return NextResponse.json({ ok: true, requests });
}
