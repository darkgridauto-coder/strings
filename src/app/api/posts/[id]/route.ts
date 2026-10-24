import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession();
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, handle: true, displayName: true, avatar: true, isPrivate: true, verifiedTier: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } } },
        },
      },
    });
    if (!post) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    let likedByMe = false;
    let savedByMe = false;
    if (session) {
      const [like, save] = await Promise.all([
        prisma.like.findFirst({ where: { postId: post.id, userId: session.userId } }),
        prisma.savedPost.findFirst({ where: { postId: post.id, userId: session.userId } }),
      ]);
      likedByMe = Boolean(like);
      savedByMe = Boolean(save);
    }
    return NextResponse.json({
      ok: true,
      post: {
        id: post.id, body: post.body, media: post.media || '',
        mediaUrls: [], createdAt: post.createdAt, editedAt: null,
        author: post.author, likeCount: post._count.likes, commentCount: post._count.comments,
        likedByMe, savedByMe, repostOf: null, poll: null,
        comments: post.comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: c.author })),
      },
    });
  } catch (e: any) {
    console.error('[/api/posts/[id]]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ ok: false }, { status: 401 });
    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
    if (!post) return NextResponse.json({ ok: false }, { status: 404 });
    if (post.authorId !== s.userId) return NextResponse.json({ ok: false }, { status: 403 });
    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
