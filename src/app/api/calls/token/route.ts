import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const { roomName } = await req.json();
  if (!roomName) return NextResponse.json({ ok: false, error: 'roomName required' }, { status: 400 });

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
