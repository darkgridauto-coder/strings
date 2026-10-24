import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  plan: z.enum(['monthly', 'annual']),
  kind: z.enum(['pro', 'verify']).default('pro'),
});
const DAYS = { monthly: 30, annual: 365 };

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid plan' }, { status: 400 });
  const renewsAt = new Date(Date.now() + DAYS[parsed.data.plan] * 864e5);
  const sub = await prisma.subscription.upsert({
    where: { userId_kind: { userId: s.userId, kind: parsed.data.kind } },
    create: { userId: s.userId, kind: parsed.data.kind, plan: parsed.data.plan, status: 'active', renewsAt },
    update: { plan: parsed.data.plan, status: 'active', renewsAt },
  });
  return NextResponse.json({ ok: true, subscription: sub });
}
