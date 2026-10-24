import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: s.userId, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
