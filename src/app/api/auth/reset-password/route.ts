import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashCode } from '@/lib/emailVerify';
import { hashPassword, revokeAllSessionsForUser } from '@/lib/auth';
import { rateLimit, getClientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(getClientKey(req, 'resetpw'), 5, 60000);
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in ' + rl.retryAfter + 's.' }, { status: 429 });

    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 400 });
    if (!user.passwordResetHash || !user.passwordResetExp) return NextResponse.json({ ok: false, error: 'No reset requested' }, { status: 400 });
    if (user.passwordResetExp.getTime() < Date.now()) return NextResponse.json({ ok: false, error: 'Code expired' }, { status: 400 });
    if (hashCode(code) !== user.passwordResetHash) return NextResponse.json({ ok: false, error: 'Incorrect code' }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetHash: '',
        passwordResetExp: null,
        passwordResetSentAt: null,
      },
    });

    await revokeAllSessionsForUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[reset-password]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
