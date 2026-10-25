import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientKey } from '@/lib/rateLimit';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail, verificationEmail } from '@/lib/mailer';
import { generateCode, hashCode, codeExpiry, cooldownRemaining } from '@/lib/emailVerify';

export async function POST(req: NextRequest) {
  const rl = rateLimit(getClientKey(req, 'resend'), 3, 60000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in ' + rl.retryAfter + 's.' }, { status: 429 });

  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: false, error: 'Already verified' }, { status: 400 });
  const cd = cooldownRemaining(user.emailVerifySentAt);
  if (cd > 0) return NextResponse.json({ ok: false, error: `Wait ${cd}s before resending.`, cooldown: cd }, { status: 429 });

  const code = generateCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyHash: hashCode(code), emailVerifyExp: codeExpiry(), emailVerifySentAt: new Date() },
  });

  const mail = await sendEmail({
    to: user.email,
    subject: 'Your Strings verification code',
    html: verificationEmail(code, user.displayName),
  });

  if (mail.dev) {
    console.log(`[DEV] Verification code for ${user.email}: ${code}`);
    return NextResponse.json({ ok: true, dev: true, email: user.email });
  }
  if (!mail.ok) {
    console.error('[resend-code] mail failed:', mail.error);
    return NextResponse.json({
      ok: false,
      error: 'Could not send email. ' + (mail.error || 'Try again in a moment.'),
    }, { status: 502 });
  }
  return NextResponse.json({ ok: true, email: user.email });
}
