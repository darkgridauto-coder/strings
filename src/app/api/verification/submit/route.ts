import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  tier: z.enum(['identity', 'professional', 'organisation']),
});

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid tier' }, { status: 400 });

  const sub = await prisma.subscription.findUnique({ where: { userId_kind: { userId: s.userId, kind: 'verify' } } });
  if (!sub || sub.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'A verification plan is required first' }, { status: 402 });
  }

  const existing = await prisma.verification.findUnique({ where: { userId_tier: { userId: s.userId, tier: parsed.data.tier } } });
  const rec = existing
    ? await prisma.verification.update({
        where: { id: existing.id },
        data: { status: 'pending', submittedAt: new Date(), reviewedAt: null, reason: '' },
      })
    : await prisma.verification.create({
        data: { userId: s.userId, tier: parsed.data.tier, status: 'pending' },
      });
  return NextResponse.json({ ok: true, verification: rec });
}
