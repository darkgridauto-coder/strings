import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { z } from 'zod';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const rows = await prisma.privacyRequest.findMany({
    orderBy: { createdAt: 'desc' }, take: 200,
    include: { user: { select: { handle: true, displayName: true } } },
  });

  return NextResponse.json({
    ok: true,
    requests: rows.map(r => ({
      id: r.id, type: r.type, status: r.status,
      identityVerified: r.identityVerified, dueAt: r.dueAt,
      notes: r.notes, createdAt: r.createdAt,
      user: { handle: r.user.handle, displayName: r.user.displayName },
    })),
  });
}

const createSchema = z.object({
  type: z.enum(['Data export', 'Account deletion', 'Correction']),
  handle: z.string().min(1).max(60),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { handle: parsed.data.handle.replace(/^@/, '').trim() } });
  if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  const created = await prisma.privacyRequest.create({
    data: {
      type: parsed.data.type,
      userId: user.id,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Received',
    },
  });
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Logged privacy request', target: `@${user.handle}`, detail: parsed.data.type },
  });
  return NextResponse.json({ ok: true, request: created });
}
