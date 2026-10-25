import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      participants: { select: { id: true, handle: true, displayName: true, avatar: true } },
      roles: true,
    },
  });
  if (!conv) return NextResponse.json({ ok: false }, { status: 404 });
  if (!conv.participants.some((p) => p.id === s.userId)) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, conversation: conv });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const { name } = await req.json();
  if (!name || typeof name !== 'string' || !name.trim()) return NextResponse.json({ ok: false }, { status: 400 });
  const role = await prisma.conversationRole.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: s.userId } } });
  if (!role || !['owner', 'admin'].includes(role.role)) return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 403 });
  await prisma.conversation.update({ where: { id: params.id }, data: { groupName: name.trim().slice(0, 60) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.conversation.update({
    where: { id: params.id },
    data: { participants: { disconnect: { id: s.userId } } },
  });
  return NextResponse.json({ ok: true });
}
