import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

function scoreUser(u: { handle: string; displayName: string; followerCount: number }, q: string): number {
  const ql = q.toLowerCase();
  const h = u.handle.toLowerCase();
  const d = u.displayName.toLowerCase();
  let score = 0;
  if (h === ql) score += 200;
  else if (h.startsWith(ql)) score += 100;
  else if (h.includes(ql)) score += 30;
  if (d === ql) score += 150;
  else if (d.startsWith(ql)) score += 70;
  else if (d.includes(ql)) score += 20;
  score += Math.log(1 + u.followerCount) * 12;
  return score;
}

function scorePost(p: { body: string; likeCount: number; commentCount: number; createdAt: Date }, q: string): number {
  const ql = q.toLowerCase();
  const b = p.body.toLowerCase();
  let score = 0;
  if (b.startsWith(ql)) score += 80;
  else if (b.includes(ql)) score += 30;
  score += Math.log(1 + p.likeCount) * 15;
  score += Math.log(1 + p.commentCount) * 10;
  const ageDays = (Date.now() - p.createdAt.getTime()) / (24 * 60 * 60 * 1000);
  score += Math.max(0, 30 - ageDays * 0.5);
  return score;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (!q) return NextResponse.json({ ok: true, users: [], posts: [] });

  const [rawUsers, rawPosts, follows] = await Promise.all([
    prisma.user.findMany({
      where: { OR: [{ handle: { contains: q.toLowerCase() } }, { displayName: { contains: q } }] },
      select: {
        id: true, handle: true, displayName: true, bio: true, isPrivate: true,
        _count: { select: { followers: { where: { status: 'accepted' } } } },
      },
      take: 100,
    }),
    prisma.post.findMany({
      where: { body: { contains: q } },
      include: {
        author: { select: { id: true, handle: true, displayName: true, isPrivate: true } },
        _count: { select: { likes: true, comments: true } },
      },
      take: 100,
    }),
    prisma.follow.findMany({ where: { followerId: session.userId, status: 'accepted' }, select: { followingId: true } }),
  ]);

  const followingIds = new Set(follows.map((f) => f.followingId));

  const users = rawUsers
    .filter((u) => u.id !== session.userId)
    .map((u) => ({
      id: u.id, handle: u.handle, displayName: u.displayName, bio: u.bio, isPrivate: u.isPrivate,
      score: scoreUser({ handle: u.handle, displayName: u.displayName, followerCount: u._count.followers }, q) + (followingIds.has(u.id) ? 15 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(({ score: _s, ...rest }) => rest);

  const posts = rawPosts
    .filter((p) => !p.author.isPrivate || followingIds.has(p.author.id) || p.author.handle === session.handle)
    .map((p) => ({
      id: p.id, body: p.body, media: p.media, createdAt: p.createdAt,
      author: { handle: p.author.handle, displayName: p.author.displayName },
      score: scorePost({ body: p.body, likeCount: p._count.likes, commentCount: p._count.comments, createdAt: p.createdAt }, q),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map(({ score: _s, ...rest }) => rest);

  return NextResponse.json({ ok: true, users, posts });
}
