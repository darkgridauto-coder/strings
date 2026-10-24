import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  const role = await prisma.conversationRole.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: s.userId } } });
  if (!role || !['owner', 'admin'].includes(role.role)) return NextResponse.json({ ok: false, error: 'Not allowed' }, { status: 403 });

  const { handle } = await req.json();
  const target = await prisma.user.findUnique({ where: { handle } });
  if (!target) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  await prisma.conversation.update({ where: { id: params.id }, data: { participants: { connect: { id: target.id } } } });
  await prisma.conversationRole.upsert({
    where: { conversationId_userId: { conversationId: params.id, userId: target.id } },
    create: { conversationId: params.id, userId: target.id, role: 'member' },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
