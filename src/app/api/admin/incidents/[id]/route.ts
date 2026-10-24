import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['Investigating', 'Identified', 'Monitoring', 'Resolved']).optional(),
  update: z.string().min(1).max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const inc = await prisma.incident.findUnique({ where: { id: params.id } });
  if (!inc) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  let updates: { t: string; tm: number }[] = [];
  try { updates = JSON.parse(inc.updatesJson || '[]'); } catch {}
  if (parsed.data.update) updates.unshift({ t: parsed.data.update, tm: Date.now() });

  await prisma.incident.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status || inc.status,
      updatesJson: JSON.stringify(updates.slice(0, 50)),
    },
  });
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Updated incident', target: params.id, detail: parsed.data.status || 'update' },
  });
  return NextResponse.json({ ok: true });
}
