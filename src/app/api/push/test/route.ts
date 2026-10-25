import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendPushToUser } from '@/lib/push';

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  await sendPushToUser(s.userId, { title: 'Strings', body: 'Push notifications are working.', tag: 'test' });
  return NextResponse.json({ ok: true });
}
