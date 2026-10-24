import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { autoGrantAdminTier, revokeVerifiedTier } from '@/lib/verifyGrant';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, handle: true, displayName: true, email: true, bio: true,
      role: true, emailVerified: true, isPrivate: true, avatar: true, cover: true,
      twoFactorEnabled: true, createdAt: true,
      _count: { select: { posts: true, followers: true, following: true, statuses: true, comments: true } },
      verifications: { select: { tier: true, status: true, submittedAt: true } },
      subscriptions: { select: { kind: true, plan: true, status: true, renewsAt: true } },
    },
  });
  if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  const [reportsAgainst, recentPosts] = await Promise.all([
    prisma.report.findMany({ where: { targetType: 'user', targetId: user.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.post.findMany({ where: { authorId: user.id }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, body: true, createdAt: true } }),
  ]);

  const recentActions = await prisma.adminAction.findMany({
    where: { target: { contains: user.handle } },
    orderBy: { createdAt: 'desc' }, take: 10,
  });

  return NextResponse.json({ ok: true, user, reportsAgainst, recentPosts, recentActions });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  if (typeof body.role === 'string' && ['user', 'admin'].includes(body.role)) data.role = body.role;
  if (typeof body.isPrivate === 'boolean') data.isPrivate = body.isPrivate;
  if (typeof body.emailVerified === 'boolean') data.emailVerified = body.emailVerified;
  if (typeof body.suspended === 'boolean') { /* handled via report resolution */ }

  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  if (data.role === 'admin') await autoGrantAdminTier(updated.id).catch(() => {});
  if (data.role === 'user') await revokeVerifiedTier(updated.id).catch(() => {});
  await prisma.adminAction.create({
    data: {
      actorId: auth.userId, action: 'Updated user',
      target: `@${updated.handle}`,
      detail: JSON.stringify(data),
    },
  });
  return NextResponse.json({ ok: true, user: updated });
}
