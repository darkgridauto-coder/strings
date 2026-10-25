import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET() {
  const auth = await requirePermission('overview');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.error === 'Not signed in' ? 401 : 403 });
  const [openReports, users, posts, pendingVerifs] = await Promise.all([
    prisma.report.count({ where: { status: 'open' } }),
    prisma.user.count(),
    prisma.post.count(),
    prisma.verification.count({ where: { status: 'pending' } }),
  ]);
  return NextResponse.json({ ok: true, stats: { openReports, users, posts, pendingVerifs } });
}
