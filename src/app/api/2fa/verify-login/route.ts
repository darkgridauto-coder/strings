import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPending2FA, clearPending2FACookie, setSessionCookie, signSession } from '@/lib/auth';
import { verifyCode, verifyBackupCode } from '@/lib/twoFactor';

export async function POST(req: NextRequest) {
  const pending = getPending2FA();
  if (!pending) return NextResponse.json({ ok: false, error: 'No pending 2FA session' }, { status: 400 });

  const { code } = await req.json();
  if (!code || typeof code !== 'string') return NextResponse.json({ ok: false, error: 'Code required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user || !user.twoFactorEnabled) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 400 });

  // Try TOTP first
  if (verifyCode(user.twoFactorSecret, code)) {
    setSessionCookie(signSession({ userId: user.id, handle: user.handle, role: user.role }));
    clearPending2FACookie();
    return NextResponse.json({ ok: true });
  }

  // Then try backup code
  let backup: string[] = [];
  try { backup = JSON.parse(user.twoFactorBackupCodes || '[]'); } catch {}
  const { ok, remaining } = verifyBackupCode(backup, code);
  if (ok) {
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorBackupCodes: JSON.stringify(remaining) } });
    setSessionCookie(signSession({ userId: user.id, handle: user.handle, role: user.role }));
    clearPending2FACookie();
    return NextResponse.json({ ok: true, usedBackupCode: true });
  }

  return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 401 });
}
