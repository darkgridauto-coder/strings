import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/mailer';
import { generateCode, hashCode, codeExpiry } from '@/lib/emailVerify';
import { rateLimit, getClientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(getClientKey(req, 'recovery'), 5, 60000);
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many attempts. Try again in ' + rl.retryAfter + 's.' }, { status: 429 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: false, error: 'Email required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true });

    const code = generateCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetHash: hashCode(code),
        passwordResetExp: codeExpiry(),
        passwordResetSentAt: new Date(),
      },
    });

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2>Reset your Strings password</h2>
        <p>Enter this code in the app to reset your password:</p>
        <div style="background:#f5f5f5;padding:16px;font-size:24px;letter-spacing:4px;text-align:center;border-radius:8px">${code}</div>
        <p style="color:#767676;font-size:14px;margin-top:24px">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    const mail = await sendEmail({ to: email, subject: 'Strings - Password Reset Code', html });
    if (mail.dev) console.log(`[DEV] Password reset code for ${email}: ${code}`);

    return NextResponse.json({ ok: true, dev: !!mail.dev });
  } catch (e) {
    console.error('[recovery]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
