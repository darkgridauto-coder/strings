import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';
import { z } from 'zod';

const schema = z.object({ postId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const auth = await requirePermission('content');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: parsed.data.postId } });
  if (!post) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });

  await prisma.post.update({
    where: { id: parsed.data.postId },
    data: {
      hiddenAt: null,
      reviewedAt: null,
      reviewDecision: '',
      reviewCats: '[]',
    },
  });

  await prisma.adminAction.create({
    data: {
      actorId: auth.userId,
      action: 'Restored post',
      target: `post:${parsed.data.postId}`,
      detail: 'Restored from removed queue',
    },
  });

  return NextResponse.json({ ok: true });
}
