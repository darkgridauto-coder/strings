import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';
import { z } from 'zod';

export async function GET() {
  const auth = await requirePermission('health');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: 'desc' }, take: 100,
  });

  return NextResponse.json({
    ok: true,
    incidents: incidents.map(i => {
      let updates: { t: string; tm: number }[] = [];
      try { updates = JSON.parse(i.updatesJson || '[]'); } catch {}
      return {
        id: i.id, title: i.title, severity: i.severity, status: i.status,
        updates, createdAt: i.createdAt, updatedAt: i.updatedAt,
      };
    }),
  });
}

const createSchema = z.object({
  title: z.string().min(3).max(120),
  severity: z.enum(['SEV1', 'SEV2', 'SEV3']),
  firstUpdate: z.string().min(5).max(1000),
});

export async function POST(req: NextRequest) {
  const auth = await requirePermission('health');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const incident = await prisma.incident.create({
    data: {
      title: parsed.data.title,
      severity: parsed.data.severity,
      status: 'Investigating',
      updatesJson: JSON.stringify([{ t: parsed.data.firstUpdate, tm: Date.now() }]),
      createdById: auth.userId,
    },
  });
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Opened incident', target: incident.id, detail: parsed.data.title },
  });
  return NextResponse.json({ ok: true, incident });
}
