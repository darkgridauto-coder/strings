import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const AUTHOR_SELECT = { id: true, handle: true, displayName: true, avatar: true, isPrivate: true, verifiedTier: true };

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: AUTHOR_SELECT },
        _count: { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } } },
        },
        repostOf: {
          include: { author: { select: AUTHOR_SELECT }, _count: { select: { likes: true, comments: true } } },
        },
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
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

    let mediaUrls: string[] = [];
    try { mediaUrls = post.mediaUrls ? JSON.parse(post.mediaUrls) : []; } catch {}

    let poll: any = null;
    if (post.poll) {
      const vote = session
        ? await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId: post.poll.id, userId: session.userId } } })
        : null;
      poll = {
        id: post.poll.id,
        question: post.poll.question,
        closesAt: post.poll.closesAt,
        options: post.poll.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
        votedOptionId: vote?.optionId || null,
      };
    }

    let repostOf: any = null;
    if (post.repostOf) {
      let repostMediaUrls: string[] = [];
      try { repostMediaUrls = post.repostOf.mediaUrls ? JSON.parse(post.repostOf.mediaUrls) : []; } catch {}
      repostOf = {
        id: post.repostOf.id,
        body: post.repostOf.body,
        media: post.repostOf.media,
        mediaUrls: repostMediaUrls,
        createdAt: post.repostOf.createdAt,
        author: post.repostOf.author,
        likeCount: post.repostOf._count.likes,
        commentCount: post.repostOf._count.comments,
      };
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: post.id, body: post.body, media: post.media || '', mediaUrls,
        createdAt: post.createdAt, editedAt: post.editedAt || null,
        quoteText: post.quoteText || '', author: post.author,
        likeCount: post._count.likes, commentCount: post._count.comments,
        likedByMe, savedByMe, repostOf, poll,
        comments: post.comments.map((c) => ({
          id: c.id, body: c.body, createdAt: c.createdAt, parentId: c.parentId, author: c.author,
        })),
      },
    });
  } catch (e: any) {
    console.error('[/api/posts/[id] GET]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { authorId: true, pollId: true, repostOfId: true },
  });
  if (!post) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (post.authorId !== s.userId) return NextResponse.json({ ok: false, error: 'Not your post' }, { status: 403 });
  if (post.pollId) return NextResponse.json({ ok: false, error: 'Posts with polls cannot be edited' }, { status: 400 });
  if (post.repostOfId) return NextResponse.json({ ok: false, error: 'Reposts cannot be edited' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return NextResponse.json({ ok: false, error: 'Body cannot be empty' }, { status: 400 });
  if (text.length > 500) return NextResponse.json({ ok: false, error: 'Posts are limited to 500 characters' }, { status: 400 });

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: { body: text, editedAt: new Date() },
  });
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = await getSession();
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
