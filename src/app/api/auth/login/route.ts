import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, createSession, setSessionCookie, signPending2FA, setPending2FACookie, clearSessionCookie } from '@/lib/auth';
import { rateLimit, getClientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(getClientKey(req, 'login'), 10, 60000);
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in ' + rl.retryAfter + 's.' }, { status: 429 });

    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    if (user.suspended) return NextResponse.json({ ok: false, error: 'This account has been suspended.' }, { status: 403 });

    const sessionPayload = { userId: user.id, handle: user.handle, role: user.role };

    if (user.twoFactorEnabled) {
      setPending2FACookie(signPending2FA(sessionPayload));
      return NextResponse.json({ ok: true, needs2FA: true });
    }

    await clearSessionCookie();
    const token = await createSession(sessionPayload, {
      userAgent: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '',
    });
    setSessionCookie(token);

    return NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle, displayName: user.displayName } });
  } catch (e) {
    console.error('[login]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
