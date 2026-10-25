import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

export async function GET() {
  const auth = await requirePermission('messaging');
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: 403 });

  const [total, groups, messages, pending] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.count({ where: { status: 'group' } }),
    prisma.message.count(),
    prisma.conversation.count({ where: { status: 'pending' } }),
  ]);

  return NextResponse.json({
    ok: true,
    counts: { total, groups, dm: total - groups, messages, pending, locked: 0 },
  });
}
