import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['approve', 'decline', 'remove']),
  reason: z.string().max(300).optional(),
});

const TIER_TO_TIER: Record<string, string> = { identity: 'identity', professional: 'professional', organisation: 'organisation' };

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const v = await prisma.verification.findUnique({ where: { id: params.id }, include: { user: { select: { handle: true } } } });
  if (!v) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  if (parsed.data.action === 'approve') {
    await prisma.$transaction([
      prisma.verification.update({ where: { id: params.id }, data: { status: 'verified', reviewedAt: new Date(), reason: '' } }),
      prisma.user.update({ where: { id: v.userId }, data: { verifiedTier: TIER_TO_TIER[v.tier] || v.tier } }),
    ]);
  } else if (parsed.data.action === 'decline') {
    await prisma.verification.update({ where: { id: params.id }, data: { status: 'rejected', reviewedAt: new Date(), reason: parsed.data.reason || 'Requirements not met' } });
  } else {
    await prisma.$transaction([
      prisma.verification.update({ where: { id: params.id }, data: { status: 'none', reviewedAt: new Date() } }),
      prisma.user.update({ where: { id: v.userId }, data: { verifiedTier: '' } }),
    ]);
  }

  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: `Verification ${parsed.data.action}`, target: `@${v.user.handle} · ${v.tier}`, detail: parsed.data.reason || '' },
  });

  return NextResponse.json({ ok: true });
}
