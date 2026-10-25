import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, verifyPassword } from '@/lib/auth';
import { verifyCode } from '@/lib/twoFactor';

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const { password, code } = await req.json();
  if (!password || !code) return NextResponse.json({ ok: false, error: 'Password and code required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user || !user.twoFactorEnabled) return NextResponse.json({ ok: false, error: '2FA not enabled' }, { status: 400 });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return NextResponse.json({ ok: false, error: 'Wrong password' }, { status: 401 });
  if (!verifyCode(user.twoFactorSecret, code)) return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: '', twoFactorBackupCodes: '[]' },
  });
  return NextResponse.json({ ok: true });
}
