import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireVerifiedSession } from '@/lib/requireVerified';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

  const poll = await prisma.poll.findUnique({ where: { id: params.id }, include: { options: true } });
  if (!poll) return NextResponse.json({ ok: false, error: 'Poll not found' }, { status: 404 });
  if (poll.closesAt && poll.closesAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'Poll is closed' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const optionId = String(body.optionId || '');
  if (!poll.options.some((o) => o.id === optionId)) {
    return NextResponse.json({ ok: false, error: 'Invalid option' }, { status: 400 });
  }

  const existing = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId: params.id, userId: v.userId } },
  });
  if (existing) return NextResponse.json({ ok: false, error: 'Already voted' }, { status: 409 });

  await prisma.pollVote.create({
    data: { pollId: params.id, optionId, userId: v.userId },
  });

  const updated = await prisma.poll.findUnique({
    where: { id: params.id },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  });

  return NextResponse.json({
    ok: true,
    poll: {
      id: updated!.id,
      question: updated!.question,
      closesAt: updated!.closesAt,
      options: updated!.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
      votedOptionId: optionId,
    },
  });
}
