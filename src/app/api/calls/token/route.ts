import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const { roomName } = await req.json();
  if (!roomName || typeof roomName !== 'string') {
    return NextResponse.json({ ok: false, error: 'roomName required' }, { status: 400 });
  }

  if (roomName.startsWith('dm-')) {
    const rest = roomName.slice(3);
    const dash = rest.indexOf('-');
    if (dash < 0) return NextResponse.json({ ok: false, error: 'Invalid room' }, { status: 400 });
    const a = rest.slice(0, dash);
    const b = rest.slice(dash + 1);
    if (session.userId !== a && session.userId !== b) {
      return NextResponse.json({ ok: false, error: 'Not a participant' }, { status: 403 });
    }
  } else if (roomName.startsWith('group-')) {
    const convId = roomName.slice(6);
    const conv = await prisma.conversation.findUnique({
      where: { id: convId },
      include: { participants: { select: { id: true } } },
    });
    if (!conv || !conv.participants.some((p) => p.id === session.userId)) {
      return NextResponse.json({ ok: false, error: 'Not a participant' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ ok: false, error: 'Unrecognised room' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    return NextResponse.json({
      ok: false,
      error: 'LiveKit not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET to .env',
    }, { status: 500 });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: session.userId,
      name: session.handle,
      ttl: '1h',
    });
    at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    return NextResponse.json({ ok: true, token, url });
  } catch (e) {
    console.error('[livekit-token]', e);
    return NextResponse.json({ ok: false, error: 'Token generation failed' }, { status: 500 });
  }
}
