import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { z } from 'zod';

const schema = z.object({
  decision: z.enum(['Approved', 'Warned', 'Removed', 'Removed + strike']),
  categories: z.array(z.string()).default([]),
  reason: z.string().min(5).max(300),
});

const CATEGORY_POINTS: Record<string, number> = {
  spam: 1, harass: 2, hate: 3, threat: 3, sexual: 3,
  selfharm: 2, misinfo: 1, imperson: 2, illegal: 3, privacy: 2,
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, include: { author: { select: { id: true, suspended: true } } } });
  if (!post) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });

  const { decision, categories, reason } = parsed.data;
  const isRemoval = decision === 'Removed' || decision === 'Removed + strike';
  const isStrike = decision === 'Removed + strike';

  let suspendWarning = '';
  const ops: any[] = [];

  ops.push(prisma.post.update({
    where: { id: params.id },
    data: {
      reviewedAt: new Date(),
      reviewDecision: decision,
      reviewCats: JSON.stringify(categories),
      hiddenAt: isRemoval ? new Date() : null,
    },
  }));

  if (isStrike && categories.length > 0) {
    const points = categories.reduce((n, c) => n + (CATEGORY_POINTS[c] || 1), 0);
    ops.push(prisma.strike.create({
      data: {
        userId: post.author.id,
        issuedById: auth.userId,
        points,
        category: categories[0],
        reason,
        postId: params.id,
      },
    }));
    // Auto-suspend check
    const total = await prisma.strike.aggregate({ where: { userId: post.author.id }, _sum: { points: true } });
    const current = (total._sum.points || 0) + points;
    if (current >= 3 && !post.author.suspended) {
      ops.push(prisma.user.update({ where: { id: post.author.id }, data: { suspended: true, suspendedReason: 'Reached 3 strike points', suspendedAt: new Date() } }));
      suspendWarning = ` · Account auto-suspended (${current} strike points)`;
    }
  }

  await prisma.$transaction(ops);

  await prisma.adminAction.create({
    data: {
      actorId: auth.userId,
      action: `Guideline review · ${decision}`,
      target: `post:${params.id} by @${post.author.id}`,
      detail: `${categories.join(', ')} · ${reason}${suspendWarning}`,
    },
  });

  return NextResponse.json({ ok: true, suspendWarning });
}
