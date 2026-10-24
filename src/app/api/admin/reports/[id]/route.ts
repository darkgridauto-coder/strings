import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { z } from 'zod';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ ok: false, error: 'Report not found' }, { status: 404 });

  const [reporter, assignee, staffUsers] = await Promise.all([
    prisma.user.findUnique({ where: { id: report.reporterId }, select: { id: true, handle: true, displayName: true } }),
    report.assigneeId
      ? prisma.user.findUnique({ where: { id: report.assigneeId }, select: { id: true, handle: true, displayName: true } })
      : Promise.resolve(null),
    prisma.user.findMany({
      where: { OR: [{ role: 'admin' }, { staffRole: { not: '' } }] },
      select: { id: true, handle: true, displayName: true },
      take: 20,
    }),
  ]);

  let target: any = null;
  if (report.targetType === 'post') {
    target = await prisma.post.findUnique({
      where: { id: report.targetId },
      include: { author: { select: { id: true, handle: true, displayName: true } } },
    });
  } else if (report.targetType === 'user') {
    target = await prisma.user.findUnique({
      where: { id: report.targetId },
      select: { id: true, handle: true, displayName: true, suspended: true, emailVerified: true },
    });
  }

  let notes: { t: string; by: string; tm: number }[] = [];
  try { notes = JSON.parse(report.notesJson || '[]'); } catch {}

  return NextResponse.json({
    ok: true,
    report: { ...report, notes },
    reporter,
    assignee,
    staffUsers,
    target,
  });
}

const decisionSchema = z.object({
  action: z.enum(['dismiss', 'remove-content', 'suspend-account', 'escalate', 'resolve']),
  reason: z.string().min(5).max(300),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = decisionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ ok: false, error: 'Report not found' }, { status: 404 });

  const { action, reason } = parsed.data;
  const newStatus = action === 'escalate' ? 'in-review' : action === 'dismiss' ? 'dismissed' : 'resolved';

  if (action === 'remove-content' && report.targetType === 'post') {
    await prisma.post.update({
      where: { id: report.targetId },
      data: { hiddenAt: new Date() },
    }).catch(() => {});
  } else if (action === 'suspend-account') {
    if (report.targetType === 'user') {
      await prisma.user.update({
        where: { id: report.targetId },
        data: { suspended: true, suspendedReason: reason, suspendedAt: new Date() },
      }).catch(() => {});
    } else if (report.targetType === 'post') {
      const post = await prisma.post.findUnique({ where: { id: report.targetId }, select: { authorId: true } });
      if (post) {
        await prisma.user.update({
          where: { id: post.authorId },
          data: { suspended: true, suspendedReason: reason, suspendedAt: new Date() },
        }).catch(() => {});
      }
    }
  }

  await prisma.report.update({
    where: { id: params.id },
    data: { status: newStatus, resolution: `${action}: ${reason}` },
  });

  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: `Report ${action}`, target: `report:${params.id}`, detail: reason },
  });

  return NextResponse.json({ ok: true });
}

const metaSchema = z.object({
  severity: z.enum(['Low', 'Medium', 'High']).optional(),
  assigneeId: z.string().nullable().optional(),
  note: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = metaSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ ok: false, error: 'Report not found' }, { status: 404 });

  const updates: any = {};
  if (parsed.data.severity) updates.severity = parsed.data.severity;
  if (parsed.data.assigneeId !== undefined) updates.assigneeId = parsed.data.assigneeId || null;
  if (parsed.data.note) {
    let notes: { t: string; by: string; tm: number }[] = [];
    try { notes = JSON.parse(report.notesJson || '[]'); } catch {}
    notes.unshift({ t: parsed.data.note, by: auth.userId, tm: Date.now() });
    updates.notesJson = JSON.stringify(notes.slice(0, 30));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });
  }

  await prisma.report.update({ where: { id: params.id }, data: updates });
  await prisma.adminAction.create({
    data: {
      actorId: auth.userId,
      action: 'Updated report case',
      target: `report:${params.id}`,
      detail: JSON.stringify(updates).slice(0, 200),
    },
  });
  return NextResponse.json({ ok: true });
}
