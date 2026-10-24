import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const handle = req.nextUrl.searchParams.get('handle');
  if (!handle) return NextResponse.json({ ok: false, error: 'handle required' }, { status: 400 });

  const other = await prisma.user.findUnique({ where: { handle } });
  if (!other) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.userId, followingId: other.id } },
  });

  return NextResponse.json({
    ok: true,
    status: row ? (row.status === 'accepted' ? 'following' : 'pending') : 'none',
  });
}
