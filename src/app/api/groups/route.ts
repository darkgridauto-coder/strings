import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  handles: z.array(z.string()).min(1).max(30),
});

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  // Ensure the handles exist, excluding the creator
  const others = await prisma.user.findMany({ 
    where: { handle: { in: parsed.data.handles, not: s.handle } }, 
    select: { id: true } 
  });
  
  if (others.length === 0) return NextResponse.json({ ok: false, error: 'No valid members found' }, { status: 400 });

  const conv = await prisma.conversation.create({
    data: {
      status: 'group',
      groupName: parsed.data.name,
      groupOwnerId: s.userId,
      participants: { connect: [{ id: s.userId }, ...others.map((o) => ({ id: o.id }))] },
    },
  });
  
  await prisma.conversationRole.createMany({
    data: [
      { conversationId: conv.id, userId: s.userId, role: 'owner' },
      ...others.map((o) => ({ conversationId: conv.id, userId: o.id, role: 'member' })),
    ],
  });
  
  return NextResponse.json({ ok: true, conversation: conv });
}
