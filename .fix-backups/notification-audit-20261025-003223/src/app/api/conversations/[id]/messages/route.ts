import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notify } from '@/lib/notify';

const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  body: true,
  createdAt: true,
  readAt: true,
  mediaUrl: true,
  mediaKind: true,
  mediaDur: true,
  replyToId: true,
  reactions: true,
} as const;

async function loadConversation(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { participants: { select: { id: true } } },
  });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const conv = await loadConversation(params.id);
    if (!conv) return NextResponse.json({ ok: false, error: 'Conversation not found' }, { status: 404 });
    if (!conv.participants.some((p) => p.id === s.userId)) {
      return NextResponse.json({ ok: false, error: 'Not a participant' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: MESSAGE_SELECT,
    });

    const isRequest = conv.status === 'pending' && conv.requesterId !== s.userId;
    return NextResponse.json({ ok: true, messages, isRequest });
  } catch (e: any) {
    console.error('[/api/conversations/[id]/messages GET]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const conv = await loadConversation(params.id);
    if (!conv) return NextResponse.json({ ok: false, error: 'Conversation not found' }, { status: 404 });
    if (!conv.participants.some((p) => p.id === s.userId)) {
      return NextResponse.json({ ok: false, error: 'Not a participant' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const text = String(payload.body || '').trim();
    const mediaUrl = payload.mediaUrl ? String(payload.mediaUrl) : '';
    const mediaKind = payload.mediaKind ? String(payload.mediaKind) : '';
    const mediaDur = payload.mediaDur ? Number(payload.mediaDur) || 0 : 0;
    const replyToId = payload.replyToId ? String(payload.replyToId) : null;

    if (!text && !mediaUrl) {
      return NextResponse.json({ ok: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    if (replyToId) {
      const target = await prisma.message.findUnique({
        where: { id: replyToId },
        select: { conversationId: true },
      });
      if (!target || target.conversationId !== params.id) {
        return NextResponse.json({ ok: false, error: 'Reply target invalid' }, { status: 400 });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: s.userId,
        body: text,
        mediaUrl,
        mediaKind,
        mediaDur,
        replyToId,
      },
      select: MESSAGE_SELECT,
    });

    const io = (global as any).io;
    if (io) io.to(params.id).emit('message', message);

    // Notify every other conversation participant without delaying message delivery
    // or allowing notification failures to turn a saved message into an API failure.
    const recipients = conv.participants.filter((participant) => participant.id !== s.userId);
    const preview = text
      ? text.slice(0, 140)
      : mediaKind
        ? `Sent ${mediaKind}`
        : 'Sent an attachment';

    await Promise.allSettled(
      recipients.map((recipient) =>
        notify(
          recipient.id,
          'message',
          `@${s.handle || 'Someone'}: ${preview}`,
          '/app/messages'
        )
      )
    );

    return NextResponse.json({ ok: true, message });
  } catch (e: any) {
    console.error('[/api/conversations/[id]/messages POST]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
