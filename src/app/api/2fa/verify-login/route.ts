import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientKey } from '@/lib/rateLimit';
import { prisma } from '@/lib/db';
import { getPending2FA, clearPending2FACookie, setSessionCookie, createSession } from '@/lib/auth';
import { verifyCode, verifyBackupCode } from '@/lib/twoFactor';

export async function POST(req: NextRequest) {
  const rl = rateLimit(getClientKey(req, 'verify2fa'), 10, 60000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in ' + rl.retryAfter + 's.' }, { status: 429 });

  const pending = getPending2FA();
  if (!pending) return NextResponse.json({ ok: false, error: 'No pending 2FA session' }, { status: 400 });

  const { code } = await req.json();
  if (!code || typeof code !== 'string') return NextResponse.json({ ok: false, error: 'Code required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user || !user.twoFactorEnabled) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 400 });

  // Try TOTP first
  if (verifyCode(user.twoFactorSecret, code)) {
    const token = await createSession({ userId: user.id, handle: user.handle, role: user.role }, { userAgent: req.headers.get('user-agent') || '' });
    setSessionCookie(token);
    clearPending2FACookie();
    return NextResponse.json({ ok: true });
  }

  // Then try backup code
  let backup: string[] = [];
  try { backup = JSON.parse(user.twoFactorBackupCodes || '[]'); } catch {}
  const { ok, remaining } = verifyBackupCode(backup, code);
  if (ok) {
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorBackupCodes: JSON.stringify(remaining) } });
    const token = await createSession({ userId: user.id, handle: user.handle, role: user.role }, { userAgent: req.headers.get('user-agent') || '' });
    setSessionCookie(token);
    clearPending2FACookie();
    return NextResponse.json({ ok: true, usedBackupCode: true });
  }

  return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 401 });
}
