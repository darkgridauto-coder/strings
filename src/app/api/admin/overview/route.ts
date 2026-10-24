import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
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
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT date(createdAt) as day, count(*) as count FROM User
      WHERE createdAt >= datetime('now', '-14 days')
      GROUP BY date(createdAt) ORDER BY day DESC LIMIT 14
    `.catch(() => []),
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
