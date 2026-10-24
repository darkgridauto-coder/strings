import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(_: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const role = await prisma.conversationRole.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: s.userId } } });
  const isOwner = role?.role === 'owner';
  const isSelf = s.userId === params.userId;
  if (!isSelf && !isOwner) return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 403 });

  await prisma.conversation.update({ where: { id: params.id }, data: { participants: { disconnect: { id: params.userId } } } });
  await prisma.conversationRole.deleteMany({ where: { conversationId: params.id, userId: params.userId } });
  return NextResponse.json({ ok: true });
}
