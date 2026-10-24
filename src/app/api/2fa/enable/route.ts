import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifyCode, generateBackupCodes, hashCode } from '@/lib/twoFactor';

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const { code } = await req.json();
  if (!code) return NextResponse.json({ ok: false, error: 'Code required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user || !user.twoFactorSecret) return NextResponse.json({ ok: false, error: 'Start setup first' }, { status: 400 });
  if (user.twoFactorEnabled) return NextResponse.json({ ok: false, error: 'Already enabled' }, { status: 400 });
  if (!verifyCode(user.twoFactorSecret, code)) return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 400 });

  const codes = generateBackupCodes();
  const hashed = codes.map(hashCode);
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorBackupCodes: JSON.stringify(hashed) },
  });
  // Return codes ONCE — user must save them
  return NextResponse.json({ ok: true, backupCodes: codes });
}
