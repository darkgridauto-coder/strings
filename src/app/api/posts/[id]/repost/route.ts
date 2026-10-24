import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireVerifiedSession } from '@/lib/requireVerified';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

  const original = await prisma.post.findUnique({
    where: { id: params.id },
    include: { author: { select: { id: true, handle: true } } },
  });
  if (!original) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
  if (original.repostOfId) return NextResponse.json({ ok: false, error: 'Cannot repost a repost' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const quoteText = String(body.quoteText || '').trim().slice(0, 500);
  const isRepost = !quoteText;

  // Plain repost: one per user per post
  if (isRepost) {
    const existing = await prisma.post.findFirst({
      where: { authorId: v.userId, repostOfId: params.id, quoteText: '' },
    });
    if (existing) return NextResponse.json({ ok: false, error: 'Already reposted' }, { status: 409 });
  }

  const repost = await prisma.post.create({
    data: {
      authorId: v.userId,
      body: '',
      quoteText,
      repostOfId: params.id,
    },
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
    },
  });

  if (original.authorId !== v.userId) {
    await notify(
      original.authorId,
      'mention',
      `@${v.handle} ${isRepost ? 'reposted' : 'quoted'} your post`,
      `/app/posts/${repost.id}`
    );
  }

  return NextResponse.json({ ok: true, post: repost });
}
