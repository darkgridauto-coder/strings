import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { action } = await req.json();

  const request = await prisma.follow.findUnique({ where: { id: params.id } });
  if (!request || request.followingId !== session.userId) {
    return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });
  }

  if (action === 'accept') {
    await prisma.follow.update({ where: { id: params.id }, data: { status: 'accepted' } });
    return NextResponse.json({ ok: true, status: 'accepted' });
  }
  if (action === 'reject') {
    await prisma.follow.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, status: 'rejected' });
  }
  return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
}
