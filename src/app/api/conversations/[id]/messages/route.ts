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

const MEDIA_ALLOWED = [
  /^\/uploads\/[A-Za-z0-9._-]+$/,
  /^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9._\/-]+$/,
  /^https:\/\/[A-Za-z0-9-]+\.livekit\.cloud\/[A-Za-z0-9._\/-]+$/,
];

function isValidMediaUrl(url: string): boolean {
  if (!url) return true;
  if (url.length > 500) return false;
  return MEDIA_ALLOWED.some((re) => re.test(url));
}

async function loadConversation(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { participants: { select: { id: true } } },
  });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = await getSession();
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
    const s = await getSession();
    if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const conv = await loadConversation(params.id);
    if (!conv) return NextResponse.json({ ok: false, error: 'Conversation not found' }, { status: 404 });
    if (!conv.participants.some((p) => p.id === s.userId)) {
      return NextResponse.json({ ok: false, error: 'Not a participant' }, { status: 403 });
    }

    // Pending gate: recipient of a pending request cannot send until they accept.
    if (conv.status === 'pending' && conv.requesterId !== s.userId) {
      return NextResponse.json({
        ok: false,
        error: 'Accept this message request before replying.',
      }, { status: 403 });
    }

    // Block gate: applies to DMs only. Groups are unaffected.
    if (conv.status !== 'group') {
      const otherId = conv.participants.find((p) => p.id !== s.userId)?.id;
      if (otherId) {
        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: s.userId, blockedId: otherId },
              { blockerId: otherId, blockedId: s.userId },
            ],
          },
        });
        if (blocked) {
          return NextResponse.json({ ok: false, error: 'Cannot message this user.' }, { status: 403 });
        }
      }
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

    if (mediaUrl && !isValidMediaUrl(mediaUrl)) {
      return NextResponse.json({ ok: false, error: 'Invalid media URL' }, { status: 400 });
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

    const recipients = conv.participants.filter((p) => p.id !== s.userId);
    const preview = text
      ? text.slice(0, 140)
      : mediaKind
        ? 'Sent ' + mediaKind
        : 'Sent an attachment';

    await Promise.allSettled(
      recipients.map((r) =>
        notify(r.id, 'message', '@' + (s.handle || 'Someone') + ': ' + preview, '/app/messages')
      )
    );

    return NextResponse.json({ ok: true, message });
  } catch (e: any) {
    console.error('[/api/conversations/[id]/messages POST]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
