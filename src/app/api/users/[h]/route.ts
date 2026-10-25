import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { h: string } }) {
  try {
    const session = await getSession();
    const user = await prisma.user.findUnique({
      where: { handle: params.h },
      select: {
        id: true, handle: true, displayName: true, bio: true, avatar: true, cover: true,
        isPrivate: true, verifiedTier: true, createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    if (!user) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    let viewerFollows = false;
    let viewerPending = false;
    if (session && session.userId !== user.id) {
      const f = await prisma.follow.findFirst({ where: { followerId: session.userId, followingId: user.id } });
      viewerFollows = f?.status === 'accepted';
      viewerPending = f?.status === 'pending';
    }
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id, handle: user.handle, displayName: user.displayName,
        bio: user.bio || '', avatar: user.avatar || '', cover: user.cover || '',
        isPrivate: user.isPrivate, verifiedTier: user.verifiedTier || '',
        createdAt: user.createdAt,
        postCount: user._count.posts, followerCount: user._count.followers, followingCount: user._count.following,
        viewerFollows, viewerPending, isSelf: session?.userId === user.id,
      },
    });
  } catch (e: any) {
    console.error('[/api/users/[h]]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
