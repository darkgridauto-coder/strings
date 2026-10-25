import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';
import { z } from 'zod';

const schema = z.object({
  status:   z.enum(['open', 'in-progress', 'resolved']).optional(),
  priority: z.enum(['Low', 'Normal', 'High']).optional(),
  assigneeId: z.string().nullable().optional(),
  reply:    z.string().max(2000).optional(),
  note:     z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission('support');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  let notes: { t: string; by: string; tm: number }[] = [];
  try { notes = JSON.parse(ticket.notesJson || '[]'); } catch {}
  if (parsed.data.note) {
    notes.unshift({ t: parsed.data.note, by: auth.userId, tm: Date.now() });
  }

  const data: any = {};
  if (parsed.data.status)     data.status = parsed.data.status;
  if (parsed.data.priority)   data.priority = parsed.data.priority;
  if (parsed.data.assigneeId !== undefined) data.assigneeId = parsed.data.assigneeId;
  if (parsed.data.reply !== undefined) data.reply = parsed.data.reply;
  data.notesJson = JSON.stringify(notes.slice(0, 50));

  await prisma.supportTicket.update({ where: { id: params.id }, data });

  // Notify the user when a reply is set (only if it changed)
  if (parsed.data.reply && parsed.data.reply !== ticket.reply) {
    try {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          kind: 'support',
          body: 'Support replied to your ticket: ' + parsed.data.reply.slice(0, 100),
          link: '/app/help',
        },
      });
    } catch {}
  }
  await prisma.adminAction.create({
    data: {
      actorId: auth.userId,
      action: 'Updated support ticket',
      target: `ticket:${params.id}`,
      detail: parsed.data.note || parsed.data.status || parsed.data.priority || 'reply',
    },
  });

  return NextResponse.json({ ok: true });
}
