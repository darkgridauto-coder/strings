import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireVerifiedSession } from '@/lib/requireVerified';

export async function POST(req: NextRequest) {
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });
  const userId = v.userId;

  const body = await req.json().catch(() => ({}));
  const handle = String(body.handle || '').trim();
  if (!handle) return NextResponse.json({ ok: false, error: 'handle required' }, { status: 400 });

  const other = await prisma.user.findUnique({ where: { handle } });
  if (!other) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  if (other.id === userId) return NextResponse.json({ ok: false, error: 'Cannot chat with yourself' }, { status: 400 });

  // Find ANY existing conversation between these two users
  const matches = await prisma.conversation.findMany({
    where: {
      AND: [
        { participants: { some: { id: userId } } },
        { participants: { some: { id: other.id } } },
      ],
      NOT: { status: 'group' },
    },
    include: { participants: true, messages: { take: 1 } },
    orderBy: { createdAt: 'asc' },
  });

  if (matches.length > 0) {
    return NextResponse.json({ ok: true, conversation: matches[0] });
  }

  // Create new if none exist
  const conversation = await prisma.conversation.create({
    data: {
      status: 'pending',
      requesterId: userId,
      participants: { connect: [{ id: userId }, { id: other.id }] },
    },
    include: { participants: true, messages: true },
  });

  return NextResponse.json({ ok: true, conversation });
}
