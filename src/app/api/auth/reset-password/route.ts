import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashCode } from '@/lib/emailVerify';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 400 });
    if (!user.emailVerifyHash || !user.emailVerifyExp) return NextResponse.json({ ok: false, error: 'No reset requested' }, { status: 400 });
    if (user.emailVerifyExp.getTime() < Date.now()) return NextResponse.json({ ok: false, error: 'Code expired' }, { status: 400 });
    if (hashCode(code) !== user.emailVerifyHash) return NextResponse.json({ ok: false, error: 'Incorrect code' }, { status: 400 });

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerifyHash: '',
        emailVerifyExp: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[reset-password]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
