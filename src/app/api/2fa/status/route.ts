import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
  });
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  let remaining = 0;
  try { remaining = (JSON.parse(user.twoFactorBackupCodes || '[]') as string[]).length; } catch {}
  return NextResponse.json({ ok: true, enabled: user.twoFactorEnabled, backupCodesRemaining: remaining });
}
