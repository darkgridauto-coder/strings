import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notify } from '@/lib/notify';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const post = await prisma.post.findUnique({ where: { id: params.id }, include: { author: { select: { id: true, handle: true } } } });
  if (!post) return NextResponse.json({ ok: false }, { status: 404 });

  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: session.userId, postId: params.id } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, liked: false });
  }
  await prisma.like.create({ data: { userId: session.userId, postId: params.id } });
  if (post.authorId !== session.userId) {
    await notify(post.authorId, 'like', `@${session.handle} liked your post`, `/app/posts/${post.id}`);
  }
  return NextResponse.json({ ok: true, liked: true });
}
