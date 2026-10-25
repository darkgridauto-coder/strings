import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId: session.userId, postId: params.id } } });
  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, saved: false });
  }
  await prisma.savedPost.create({ data: { userId: session.userId, postId: params.id } });
  return NextResponse.json({ ok: true, saved: true });
}
