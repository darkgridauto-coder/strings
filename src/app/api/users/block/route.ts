import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { handle } = await req.json();
  const target = await prisma.user.findUnique({ where: { handle } });
  if (!target) return NextResponse.json({ ok: false }, { status: 404 });
  
  await prisma.block.create({ data: { blockerId: session.userId, blockedId: target.id } });
  return NextResponse.json({ ok: true });
}
