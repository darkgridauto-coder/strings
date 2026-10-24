import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { z } from 'zod';

const schema = z.object({
  type: z.enum(['post', 'comment', 'status']),
  reason: z.string().min(3).max(300).optional(),
});

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = schema.safeParse({ ...(await req.json().catch(() => ({}))), type: req.nextUrl.searchParams.get('type') });
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const { type, reason } = parsed.data;
  const detail = reason || '(no reason given)';

  try {
    if (type === 'post') {
      await prisma.post.delete({ where: { id: params.id } });
    } else if (type === 'comment') {
      await prisma.comment.delete({ where: { id: params.id } });
    } else if (type === 'status') {
      await prisma.status.delete({ where: { id: params.id } });
    }
    await prisma.adminAction.create({
      data: { actorId: auth.userId, action: `Deleted ${type}`, target: `${type}:${params.id}`, detail },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Delete failed' }, { status: 500 });
  }
}
