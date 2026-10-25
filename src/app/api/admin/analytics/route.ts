import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET() {
  const auth = await requirePermission('analytics');
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: 403 });

  const [
    users, posts, reports, resolvedReports, modActions,
    totalLikes, totalComments, suspendedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { hiddenAt: null } }),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'resolved' } }),
    prisma.adminAction.count(),
    prisma.like.count(),
    prisma.comment.count(),
    prisma.user.count({ where: { suspended: true } }),
  ]);

  const [postsByAuthor, reportsByCat, actionsByDay] = await Promise.all([
    prisma.post.groupBy({ by: ['authorId'], _count: true, where: { hiddenAt: null } }),
    prisma.report.groupBy({ by: ['targetType'], _count: true }),
    prisma.adminAction.findMany({ select: { createdAt: true }, take: 500, orderBy: { createdAt: 'desc' } }),
  ]);

  const authorIds = postsByAuthor.map(r => r.authorId);
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, handle: true, displayName: true } });
  const authorMap = Object.fromEntries(authors.map(u => [u.id, u]));

  const byAuthor = postsByAuthor
    .map(r => ({ label: '@' + (authorMap[r.authorId]?.handle || 'unknown'), value: r._count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  const byCategory = reportsByCat.map(r => ({ label: r.targetType, value: r._count }));

  const dayBuckets: Record<string, number> = {};
  for (const a of actionsByDay) {
    const day = new Date(a.createdAt).toISOString().slice(0, 10);
    dayBuckets[day] = (dayBuckets[day] || 0) + 1;
  }
  const byDay = Object.entries(dayBuckets).map(([label, value]) => ({ label, value })).slice(0, 7);

  return NextResponse.json({
    ok: true,
    kpi: { users, posts, likes: totalLikes, comments: totalComments, reports, resolvedReports, modActions, suspendedUsers },
    byAuthor, byCategory, byDay,
  });
}
