import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const likes = await prisma.like.findMany({
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
  const savedIds = new Set(
    (await prisma.savedPost.findMany({ where: { userId: s.userId, postId: { in: likes.map((l) => l.postId) } }, select: { postId: true } })).map((x) => x.postId)
  );
  return NextResponse.json({
    ok: true,
    posts: likes.map((l) => ({
      id: l.post.id, body: l.post.body, media: l.post.media, createdAt: l.post.createdAt,
      author: l.post.author,
      likeCount: l.post._count.likes,
      commentCount: l.post._count.comments,
      likedByMe: true,
      savedByMe: savedIds.has(l.post.id),
    })),
  });
}
