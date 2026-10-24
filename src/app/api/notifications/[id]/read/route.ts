import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.notification.updateMany({ where: { id: params.id, userId: s.userId }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
