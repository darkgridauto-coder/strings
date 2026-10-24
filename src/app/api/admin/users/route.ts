import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.error === 'Not signed in' ? 401 : 403 });

  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const take = Math.min(100, Number(req.nextUrl.searchParams.get('take') || 50));
  const skip = Math.max(0, Number(req.nextUrl.searchParams.get('skip') || 0));
  const filter = req.nextUrl.searchParams.get('filter') || 'all';

  const where: any = {};
  if (q) where.OR = [
    { handle: { contains: q.toLowerCase() } },
    { displayName: { contains: q } },
    { email: { contains: q } },
  ];
  if (filter === 'unverified') where.emailVerified = false;
  if (filter === 'private') where.isPrivate = true;
  if (filter === 'admin') where.role = 'admin';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, take, skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, handle: true, displayName: true, email: true,
        role: true, emailVerified: true, isPrivate: true,
        createdAt: true, avatar: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ ok: true, users, total, take, skip });
}
