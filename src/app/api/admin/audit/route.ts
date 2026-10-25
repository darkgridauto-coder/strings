import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET(req: NextRequest) {
  const auth = await requirePermission('audit');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const format = req.nextUrl.searchParams.get('format') || 'json';

  const where: any = {};
  if (q) where.OR = [
    { action: { contains: q } },
    { target: { contains: q } },
    { detail: { contains: q } },
  ];

  const actions = await prisma.adminAction.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });

  if (format === 'csv') {
    const header = 'Date,Actor ID,Action,Target,Detail\n';
    const rows = actions.map(a =>
      [new Date(a.createdAt).toISOString(), a.actorId, a.action, a.target, a.detail]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="strings-audit-log.csv"',
      },
    });
  }

  return NextResponse.json({ ok: true, actions });
}
