import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: 403 });

  const [openReports, pendingVerifs, pendingReviews] = await Promise.all([
    prisma.report.count({ where: { status: 'open' } }),
    prisma.verification.count({ where: { status: 'pending' } }),
    prisma.post.count({ where: { reviewedAt: null, hiddenAt: null, author: { suspended: false } } }),
  ]);

  return NextResponse.json({
    ok: true,
    counts: { openReports, pendingVerifs, pendingReviews, openSupport: 0 },
  });
}
