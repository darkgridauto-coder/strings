import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET() {
  const auth = await requirePermission('verif');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const rows = await prisma.verification.findMany({
    orderBy: { submittedAt: 'desc' },
    include: { user: { select: { id: true, handle: true, displayName: true, emailVerified: true, suspended: true } } },
  });
  return NextResponse.json({ ok: true, verifications: rows });
}
