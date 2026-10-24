import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const { handle } = await req.json();
  if (handle === s.handle) return NextResponse.json({ ok: false, error: 'Cannot follow yourself' }, { status: 400 });

  const other = await prisma.user.findUnique({ where: { handle } });
  if (!other) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  const status = other.isPrivate ? 'pending' : 'accepted';
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: s.userId, followingId: other.id } },
    create: { followerId: s.userId, followingId: other.id, status },
    update: { status },
  });

  if (status === 'accepted') {
    await notify(other.id, 'follow', `@${s.handle} followed you`, `/app/u/${s.handle}`);
  }
  return NextResponse.json({
    ok: true,
    following: status === 'accepted',
    pending: status === 'pending',
    message: status === 'pending' ? 'Follow request sent. This account is private.' : 'Now following.',
  });
}

export async function DELETE(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const { handle } = await req.json();
  const other = await prisma.user.findUnique({ where: { handle } });
  if (!other) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  await prisma.follow.deleteMany({ where: { followerId: s.userId, followingId: other.id } });
  return NextResponse.json({ ok: true, following: false });
}
