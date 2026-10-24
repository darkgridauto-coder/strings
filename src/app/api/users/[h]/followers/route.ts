import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { h: string } }) {
  const user = await prisma.user.findUnique({ where: { handle: params.h }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  const rows = await prisma.follow.findMany({
    where: { followingId: user.id, status: 'accepted' },
    orderBy: { createdAt: 'desc' },
    include: { follower: { select: { id: true, handle: true, displayName: true, avatar: true, bio: true } } },
  });
  return NextResponse.json({ ok: true, users: rows.map((r) => r.follower) });
}
