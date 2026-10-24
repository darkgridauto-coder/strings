import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validation';
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth';
import { sendEmail, verificationEmail } from '@/lib/mailer';
import { generateCode, hashCode, codeExpiry } from '@/lib/emailVerify';
import { isEnabled } from '@/lib/platform';

export async function POST(req: NextRequest) {
  try {
    if (!(await isEnabled('signups'))) {
      return NextResponse.json({ ok: false, error: 'New sign-ups are temporarily closed.' }, { status: 503 });
    }
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    
    const { displayName, handle, email, password } = parsed.data;
    
    // Check if user exists
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { handle }] } });
    
    if (existing) {
      // If the account is already verified, they must log in.
      if (existing.emailVerified) {
        if (existing.email === email) return NextResponse.json({ ok: false, error: 'That email is already registered. Please log in.' }, { status: 409 });
        return NextResponse.json({ ok: false, error: 'That username is taken.' }, { status: 409 });
      }
      
      // If the account exists but is UNVERIFIED, we allow them to resume signup
      const passwordHash = await hashPassword(password);
      const code = generateCode();
      
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName,
          handle, // In case they changed the username
          passwordHash,
          emailVerifyHash: hashCode(code),
          emailVerifyExp: codeExpiry(),
          emailVerifySentAt: new Date(),
        },
      });
      
      const mail = await sendEmail({ to: email, subject: 'Your Strings verification code', html: verificationEmail(code, displayName) });
      if (mail.dev) console.log(`[DEV] Verification code for ${email}: ${code}`);
      
      setSessionCookie(signSession({ userId: user.id, handle: user.handle, role: user.role }));
      return NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle, displayName: user.displayName } });
    }
    
    // Brand new user
    const passwordHash = await hashPassword(password);
    const code = generateCode();
    const user = await prisma.user.create({
      data: {
        displayName, handle, email, passwordHash,
        emailVerifyHash: hashCode(code),
        emailVerifyExp: codeExpiry(),
        emailVerifySentAt: new Date(),
      },
    });
    
    const mail = await sendEmail({ to: email, subject: 'Your Strings verification code', html: verificationEmail(code, displayName) });
    if (mail.dev) console.log(`[DEV] Verification code for ${email}: ${code}`);
    
    setSessionCookie(signSession({ userId: user.id, handle: user.handle, role: user.role }));
    return NextResponse.json({ ok: true, user: { id: user.id, handle: user.handle, displayName: user.displayName } });
    
  } catch (e) {
    console.error('[register]', e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
