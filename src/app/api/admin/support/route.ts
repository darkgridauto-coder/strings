import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: { user: { select: { handle: true, displayName: true } } },
  });

  return NextResponse.json({
    ok: true,
    tickets: tickets.map(t => {
      let notes: { t: string; by: string; tm: number }[] = [];
      try { notes = JSON.parse(t.notesJson || '[]'); } catch {}
      return {
        id: t.id, category: t.category, subject: t.subject, body: t.body,
        status: t.status, priority: t.priority, assigneeId: t.assigneeId,
        reply: t.reply, notes, createdAt: t.createdAt, updatedAt: t.updatedAt,
        user: { handle: t.user.handle, displayName: t.user.displayName },
      };
    }),
  });
}
