import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  category: z.string().min(1).max(60),
  subject:  z.string().min(3).max(120),
  body:     z.string().min(5).max(2000),
});

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }, { status: 400 });

  const ticket = await prisma.supportTicket.create({
    data: { userId: s.userId, ...parsed.data },
  });
  return NextResponse.json({ ok: true, ticket });
}
