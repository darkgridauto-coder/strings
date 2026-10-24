import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const saved = await prisma.savedPost.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });
  const liked = await prisma.like.findMany({
    where: { userId: s.userId, postId: { in: saved.map((x) => x.postId) } },
    select: { postId: true },
  });
  const likedSet = new Set(liked.map((l) => l.postId));
  return NextResponse.json({
    ok: true,
    posts: saved.map((x) => ({
      id: x.post.id,
      body: x.post.body,
      media: x.post.media,
      createdAt: x.post.createdAt,
      author: x.post.author,
      likeCount: x.post._count.likes,
      commentCount: x.post._count.comments,
      likedByMe: likedSet.has(x.post.id),
      savedByMe: true,
    })),
  });
}
