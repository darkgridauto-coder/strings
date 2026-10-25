import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false });
  const { handle, type } = await req.json();
  const other = await prisma.user.findUnique({ where: { handle } });
  if (other) {
    await prisma.call.create({ data: { callerId: session.userId, receiverId: other.id, type, status: 'answered' } });
  }
  return NextResponse.json({ ok: true });
}
