import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, signSession, setSessionCookie, signPending2FA, setPending2FACookie, clearSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });

    if (user.suspended) {
      return NextResponse.json({ ok: false, error: 'This account has been suspended.' }, { status: 403 });
    }

    const sessionPayload = { userId: user.id, handle: user.handle, role: user.role };

    if (user.twoFactorEnabled) {
      const token = signPending2FA(sessionPayload);
      setPending2FACookie(token);
      return NextResponse.json({ ok: true, needs2FA: true });
    }

    clearSessionCookie();
    setSessionCookie(signSession(sessionPayload));
    
    return NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle, displayName: user.displayName } });
  } catch (e) {
    console.error('[login]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
