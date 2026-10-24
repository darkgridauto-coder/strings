import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

const GLOSSARY: Record<string, { label: string; points: number; re: RegExp }> = {
  spam:      { label: 'Spam & scams',          points: 1, re: /free money|click here|giveaway|crypto double|dm me to earn|whatsapp me/i },
  harass:    { label: 'Harassment & bullying', points: 2, re: /idiot|loser|ugly|kill yourself|shut up|stupid/i },
  hate:      { label: 'Hate speech',           points: 3, re: /\b(hate|go back to)\b.*(people|race|religion)/i },
  threat:    { label: 'Violence & threats',    points: 3, re: /i will (kill|hurt|find you)|bomb|shoot/i },
  sexual:    { label: 'Sexual content',        points: 3, re: /nude|explicit|18\+|nsfw/i },
  selfharm:  { label: 'Self-harm',             points: 2, re: /suicide|end my life|self.?harm/i },
  misinfo:   { label: 'Misinformation',        points: 1, re: /miracle cure|fake news|100% guaranteed/i },
  imperson:  { label: 'Impersonation',         points: 2, re: /official support|i am the admin|verify your account here/i },
  illegal:   { label: 'Illegal goods',         points: 3, re: /buy (drugs|guns)|stolen|counterfeit/i },
  privacy:   { label: 'Private information',   points: 2, re: /\b\d{10,}\b|my address is|passport number/i },
};

function autoFlag(body: string): string[] {
  return Object.entries(GLOSSARY).filter(([, g]) => g.re.test(body || '')).map(([k]) => k);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: 403 });

  const [queue, done, strikes] = await Promise.all([
    prisma.post.findMany({
      where: { reviewedAt: null, hiddenAt: null, author: { suspended: false } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        author: { select: { id: true, handle: true, displayName: true, suspended: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.findMany({
      where: { reviewedAt: { not: null } },
      orderBy: { reviewedAt: 'desc' },
      take: 60,
      include: { author: { select: { handle: true, displayName: true } } },
    }),
    prisma.strike.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  const reportsByPost = await prisma.report.groupBy({
    by: ['targetId'],
    where: { targetType: 'post' },
    _count: true,
  });
  const reportMap = Object.fromEntries(reportsByPost.map(r => [r.targetId, r._count]));

  const strikeTotals: Record<string, number> = {};
  for (const s of strikes) strikeTotals[s.userId] = (strikeTotals[s.userId] || 0) + s.points;

  const strikeUserIds = [...new Set(strikes.map(s => s.userId))];
  const strikeUsers = await prisma.user.findMany({ where: { id: { in: strikeUserIds } }, select: { id: true, handle: true, suspended: true } });
  const strikeUserMap = Object.fromEntries(strikeUsers.map(u => [u.id, u]));

  return NextResponse.json({
    ok: true,
    queue: queue.map(p => ({
      id: p.id, body: p.body, media: p.media || '', createdAt: p.createdAt,
      author: p.author,
      reports: reportMap[p.id] || 0,
      autoFlags: autoFlag(p.body),
      likes: p._count.likes, comments: p._count.comments,
    })),
    done: done.map(p => {
      let cats: string[] = [];
      try { cats = JSON.parse(p.reviewCats || '[]'); } catch {}
      return {
        id: p.id, body: p.body, reviewedAt: p.reviewedAt,
        decision: p.reviewDecision, categories: cats,
        author: p.author, hidden: p.hiddenAt !== null,
      };
    }),
    strikes: strikes.map(s => ({
      id: s.id, points: s.points, category: s.category, reason: s.reason,
      createdAt: s.createdAt, postId: s.postId,
      handle: strikeUserMap[s.userId]?.handle || 'unknown',
      suspended: strikeUserMap[s.userId]?.suspended || false,
    })),
    strikeTotals,
  });
}
