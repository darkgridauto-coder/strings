import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  plan: z.enum(['monthly', 'annual']),
  kind: z.enum(['pro', 'verify']).default('pro'),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      ok: false,
      error: 'Payments are not configured yet. Subscriptions will be available once a payment provider is connected.',
    }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid plan' }, { status: 400 });
  }

  return NextResponse.json({
    ok: false,
    error: 'Payment flow is not implemented yet. Contact support to manually enable this subscription.',
  }, { status: 501 });
}
