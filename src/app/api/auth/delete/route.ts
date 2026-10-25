import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, clearSessionCookie, verifyPassword } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  let password = '';
  try { const b = await req.json(); password = String(b.password || ''); } catch {}
  if (!password) return NextResponse.json({ ok: false, error: 'Password is required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });

  // Cascade deletes: sessions + posts (via onDelete: Cascade in schema)
  await prisma.user.delete({ where: { id: user.id } });
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
