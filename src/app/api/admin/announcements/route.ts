import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(2).max(80),
  message: z.string().min(5).max(200),
  kind: z.enum(['announcement', 'maintenance', 'policy']).default('announcement'),
});

export async function GET() {
  const auth = await requirePermission('overview');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const list = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ ok: true, announcements: list });
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('overview');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const ann = await prisma.announcement.create({
    data: { ...parsed.data, publishedById: auth.userId },
  });

  // Deliver to every user as a Notification
  const users = await prisma.user.findMany({ select: { id: true } });
  await prisma.notification.createMany({
    data: users.map(u => ({
      userId: u.id,
      kind: 'announcement',
      body: `Strings: ${ann.title} · ${ann.message}`.slice(0, 300),
      link: '/app/notifications',
    })),
  });

  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Published announcement', target: ann.title, detail: parsed.data.kind },
  });

  return NextResponse.json({ ok: true, announcement: ann, notifiedUsers: users.length });
}
