import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateSecret, keyUri } from '@/lib/twoFactor';

export async function POST() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  if (user.twoFactorEnabled) return NextResponse.json({ ok: false, error: '2FA already enabled' }, { status: 400 });

  const secret = generateSecret();
  const otpauth = keyUri(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  // Persist secret (not yet enabled — user must verify first)
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

  return NextResponse.json({ ok: true, secret, qrDataUrl });
}
