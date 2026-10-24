import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  body: z.string().max(120).default(''),
  bg: z.number().int().min(0).max(2).default(0),
  img: z.string().default(''),
});

const DAY = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
  if (!parsed.data.body.trim() && !parsed.data.img) {
    return NextResponse.json({ ok: false, error: 'Write something or add a photo' }, { status: 400 });
  }
  const status = await prisma.status.create({
    data: {
      userId: s.userId,
      body: parsed.data.body,
      bg: parsed.data.bg,
      img: parsed.data.img,
      expiresAt: new Date(Date.now() + DAY),
    },
  });
  return NextResponse.json({ ok: true, status });
}

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  // Find users I follow (accepted)
  const follows = await prisma.follow.findMany({
    where: { followerId: s.userId, status: 'accepted' },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);

  const statuses = await prisma.status.findMany({
    where: {
      OR: [
        { userId: s.userId },
        { userId: { in: followingIds } },
      ],
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, handle: true, displayName: true, avatar: true } },
      _count: { select: { views: true } },
    },
  });

  // My viewed set
  const myViews = await prisma.statusView.findMany({
    where: { viewerId: s.userId, statusId: { in: statuses.map((x) => x.id) } },
    select: { statusId: true },
  });
  const viewedSet = new Set(myViews.map((v) => v.statusId));

  // Group by user for the bar
  const byUser: Record<string, { user: any; items: any[]; hasUnseen: boolean }> = {};
  for (const st of statuses) {
    const key = st.userId;
    if (!byUser[key]) byUser[key] = { user: st.user, items: [], hasUnseen: false };
    byUser[key].items.push({
      id: st.id,
      body: st.body,
      bg: st.bg,
      img: st.img,
      createdAt: st.createdAt,
      viewed: viewedSet.has(st.id),
      viewCount: st._count.views,
      isMine: st.userId === s.userId,
    });
    if (!viewedSet.has(st.id) && st.userId !== s.userId) byUser[key].hasUnseen = true;
  }

  return NextResponse.json({
    ok: true,
    groups: Object.values(byUser),
    mine: Object.values(byUser).filter((g) => g.user.id === s.userId)[0] || null,
  });
}
