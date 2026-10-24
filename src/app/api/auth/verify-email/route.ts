import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hashCode } from '@/lib/emailVerify';
import { z } from 'zod';

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Enter the 6-digit code.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: s.userId } });
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, already: true });
  if (!user.emailVerifyHash || !user.emailVerifyExp) return NextResponse.json({ ok: false, error: 'No code requested. Resend one.' }, { status: 400 });
  if (user.emailVerifyExp.getTime() < Date.now()) return NextResponse.json({ ok: false, error: 'Code expired. Resend a new one.' }, { status: 400 });
  if (hashCode(parsed.data.code) !== user.emailVerifyHash) return NextResponse.json({ ok: false, error: 'Incorrect code.' }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyHash: '', emailVerifyExp: null },
  });
  return NextResponse.json({ ok: true });
}
