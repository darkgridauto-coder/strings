import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET() {
  const auth = await requirePermission('overview');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.error === 'Not signed in' ? 401 : 403 });

  const [
    users, posts, comments, statuses, conversations, messages,
    openReports, pendingVerifs, activeSubs, verifiedCounts,
    suspendedUsers, removedPosts, recentActions,
    topPosts, newUsers7d, signupsPerDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.status.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.report.count({ where: { status: 'open' } }),
    prisma.verification.count({ where: { status: 'pending' } }),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.verification.groupBy({ by: ['tier'], where: { status: 'verified' }, _count: true }),
    prisma.report.count({ where: { resolution: { contains: 'Suspend' } } }),
    prisma.report.count({ where: { resolution: { contains: 'Remove' } } }),
    prisma.adminAction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      include: { author: { select: { handle: true, displayName: true } }, _count: { select: { likes: true, comments: true } } },
    }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
    (async () => {
      const since = new Date(Date.now() - 14 * 864e5);
      const rows = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      });
      const buckets: Record<string, number> = {};
      for (const r of rows) {
        const day = r.createdAt.toISOString().slice(0, 10);
        buckets[day] = (buckets[day] || 0) + 1;
      }
      return Object.entries(buckets)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => (a.day < b.day ? 1 : -1))
        .slice(0, 14);
    })(),
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      users, posts, comments, statuses, conversations, messages,
      openReports, pendingVerifs, activeSubs,
      suspendedUsers, removedPosts, newUsers7d,
      verifiedByTier: verifiedCounts.reduce((acc, v) => { acc[v.tier] = v._count; return acc; }, {} as Record<string, number>),
    },
    recentActions,
    topPosts: topPosts.map(p => ({
      id: p.id, body: p.body.slice(0, 100), author: p.author.handle,
      authorName: p.author.displayName, likes: p._count.likes, comments: p._count.comments,
    })),
    signupsPerDay: signupsPerDay.map(r => ({ day: r.day, count: Number(r.count) })),
  });
}
