import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { STAFF_ROLES, isValidStaffRole } from '@/lib/permissions';
import { z } from 'zod';

const schema = z.object({
  staffRole: z.enum(STAFF_ROLES as unknown as [string, ...string[]]).optional(),
  deactivate: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  // Guard: cannot demote the last owner or yourself
  if (target.id === auth.userId && parsed.data.deactivate) {
    return NextResponse.json({ ok: false, error: 'You cannot deactivate yourself' }, { status: 400 });
  }

  if (parsed.data.deactivate) {
    await prisma.user.update({
      where: { id: params.id },
      data: { role: 'user', staffRole: '' },
    });
    await prisma.adminAction.create({
      data: { actorId: auth.userId, action: 'Deactivated staff member', target: `@${target.handle}`, detail: '' },
    });
  } else if (parsed.data.staffRole) {
    if (!isValidStaffRole(parsed.data.staffRole)) return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
    await prisma.user.update({
      where: { id: params.id },
      data: { staffRole: parsed.data.staffRole, role: 'admin' },
    });
    await prisma.adminAction.create({
      data: { actorId: auth.userId, action: 'Changed staff role', target: `@${target.handle}`, detail: parsed.data.staffRole },
    });
  }

  return NextResponse.json({ ok: true });
}
