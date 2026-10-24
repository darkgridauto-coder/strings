import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ ok: false }, { status: 401 });
    const result = await prisma.message.updateMany({
      where: { conversationId: params.id, senderId: { not: s.userId }, readAt: null },
      data: { readAt: new Date() },
    });
    const io = (global as any).io;
    if (io) {
      io.to(params.id).emit('read-receipt', { convId: params.id, byUserId: s.userId, at: Date.now(), count: result.count });
    }
    return NextResponse.json({ ok: true, marked: result.count });
  } catch (e: any) {
    console.error('[/read]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
