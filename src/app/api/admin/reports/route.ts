import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const status   = req.nextUrl.searchParams.get('status') || 'open';
  const severity = req.nextUrl.searchParams.get('severity') || 'all';
  const q        = (req.nextUrl.searchParams.get('q') || '').trim();

  const where: any = {};
  if (status !== 'all') where.status = status;
  if (severity !== 'all') where.severity = severity;
  if (q) where.OR = [
    { reason: { contains: q } },
    { targetId: { contains: q } },
    { targetType: { contains: q } },
  ];

  const reports = await prisma.report.findMany({
    where, orderBy: { createdAt: 'desc' }, take: 200,
  });

  const reporterIds = Array.from(new Set(reports.map(r => r.reporterId)));
  const assigneeIds = Array.from(new Set(reports.map(r => r.assigneeId).filter(Boolean) as string[]));
  const allUserIds = Array.from(new Set([...reporterIds, ...assigneeIds]));
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, handle: true, displayName: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return NextResponse.json({
    ok: true,
    reports: reports.map(r => {
      let notes: { t: string; by: string; tm: number }[] = [];
      try { notes = JSON.parse(r.notesJson || '[]'); } catch {}
      return {
        ...r,
        notes,
        reporter: userMap[r.reporterId] || null,
        assignee: r.assigneeId ? (userMap[r.assigneeId] || null) : null,
      };
    }),
  });
}
