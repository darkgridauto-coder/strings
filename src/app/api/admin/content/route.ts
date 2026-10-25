import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('content');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const type = req.nextUrl.searchParams.get('type') || 'posts';
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const take = 100;

  if (type === 'posts') {
    const where: any = {};
    if (q) where.body = { contains: q };
    const posts = await prisma.post.findMany({
      where, orderBy: { createdAt: 'desc' }, take,
      include: { author: { select: { id: true, handle: true, displayName: true } }, _count: { select: { likes: true, comments: true } } },
    });
    return NextResponse.json({
      ok: true, type, items: posts.map(p => ({
        id: p.id, body: p.body, media: p.media, createdAt: p.createdAt,
        author: p.author, likeCount: p._count.likes, commentCount: p._count.comments,
      })),
    });
  }

  if (type === 'comments') {
    const where: any = {};
    if (q) where.body = { contains: q };
    const comments = await prisma.comment.findMany({
      where, orderBy: { createdAt: 'desc' }, take,
      include: {
        author: { select: { id: true, handle: true, displayName: true } },
        post: { select: { id: true, body: true } },
      },
    });
    return NextResponse.json({ ok: true, type, items: comments });
  }

  if (type === 'status') {
    const statuses = await prisma.status.findMany({
      orderBy: { createdAt: 'desc' }, take,
      include: { user: { select: { id: true, handle: true, displayName: true } }, _count: { select: { views: true } } },
    });
    return NextResponse.json({ ok: true, type, items: statuses });
  }

  
  if (type === 'removed') {
    const posts = await prisma.post.findMany({
      where: { hiddenAt: { not: null } },
      orderBy: { hiddenAt: 'desc' },
      take,
      include: { author: { select: { id: true, handle: true, displayName: true } } },
    });
    return NextResponse.json({
      ok: true, type, items: posts.map(p => ({
        id: p.id, body: p.body, media: p.media || '', createdAt: p.createdAt,
        hiddenAt: p.hiddenAt, reviewDecision: p.reviewDecision,
        author: { handle: p.author.handle, displayName: p.author.displayName },
      })),
    });
  }

return NextResponse.json({ ok: false, error: 'Unknown type' }, { status: 400 });
}
