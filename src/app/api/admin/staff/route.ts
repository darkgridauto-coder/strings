import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { STAFF_ROLES, isValidStaffRole } from '@/lib/permissions';
import { z } from 'zod';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });

  const staff = await prisma.user.findMany({
    where: { OR: [{ role: 'admin' }, { staffRole: { not: '' } }] },
    select: { id: true, handle: true, displayName: true, email: true, role: true, staffRole: true, suspended: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ ok: true, staff });
}

const createSchema = z.object({
  handle: z.string().min(1).max(60),
  staffRole: z.enum(STAFF_ROLES as unknown as [string, ...string[]]),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
  if (!isValidStaffRole(parsed.data.staffRole)) return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { handle: parsed.data.handle.replace(/^@/, '').trim() } });
  if (!target) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });

  await prisma.user.update({
    where: { id: target.id },
    data: { role: 'admin', staffRole: parsed.data.staffRole },
  });
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Added staff member', target: `@${target.handle}`, detail: parsed.data.staffRole },
  });
  return NextResponse.json({ ok: true });
}
