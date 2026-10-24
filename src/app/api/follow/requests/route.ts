import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const pending = await prisma.follow.findMany({
    where: { followingId: session.userId, status: 'pending' },
    include: { follower: { select: { id: true, handle: true, displayName: true, bio: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, requests: pending });
}
