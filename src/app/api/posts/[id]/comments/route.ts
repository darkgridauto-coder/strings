import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { commentSchema } from '@/lib/validation';
import { notify } from '@/lib/notify';
import { requireVerifiedSession } from '@/lib/requireVerified';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

  const parsed = commentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { author: { select: { id: true } } },
  });
  if (!post) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });

  let parentAuthorId = null;
  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parsed.data.parentId } });
    if (parent) parentAuthorId = parent.authorId;
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      postId: params.id,
      authorId: v.userId,
      parentId: parsed.data.parentId || null,
    },
    include: { author: { select: { id: true, handle: true, displayName: true, avatar: true } } },
  });

  // Notify post author
  if (post.authorId !== v.userId) {
    await notify(post.authorId, 'comment', `@${v.handle} commented on your post`, `/app/posts/${post.id}`);
  }
  
  // Notify parent comment author (if it's a reply and not themselves)
  if (parentAuthorId && parentAuthorId !== v.userId && parentAuthorId !== post.authorId) {
    await notify(parentAuthorId, 'comment', `@${v.handle} replied to your comment`, `/app/posts/${post.id}`);
  }

  return NextResponse.json({ ok: true, comment });
}
