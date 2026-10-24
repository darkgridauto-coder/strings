import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  
  const { emoji } = await req.json();
  const msg = await prisma.message.findUnique({ where: { id: params.id } });
  if (!msg) return NextResponse.json({ ok: false }, { status: 404 });

  let reactions = JSON.parse(msg.reactions || '{}');
  let users = reactions[emoji] || [];
  
  if (users.includes(s.userId)) {
    users = users.filter((u: string) => u !== s.userId);
  } else {
    users.push(s.userId);
  }
  
  if (users.length === 0) delete reactions[emoji];
  else reactions[emoji] = users;

  await prisma.message.update({
    where: { id: params.id },
    data: { reactions: JSON.stringify(reactions) }
  });

  const io = (global as any).io;
  if (io) io.to(msg.conversationId).emit('reaction', { msgId: msg.id, reactions });

  return NextResponse.json({ ok: true, reactions });
}
