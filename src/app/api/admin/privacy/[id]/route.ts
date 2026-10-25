import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['Received', 'Verifying', 'In progress', 'Completed', 'Rejected']),
  identityVerified: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requirePermission('privacy');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });

  const r = await prisma.privacyRequest.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  if (parsed.data.status === 'Completed' && !parsed.data.identityVerified && !r.identityVerified) {
    return NextResponse.json({ ok: false, error: 'Verify identity before completing.' }, { status: 400 });
  }

  await prisma.privacyRequest.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      identityVerified: parsed.data.identityVerified ?? r.identityVerified,
      notes: parsed.data.notes ?? r.notes,
    },
  });
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Privacy request ' + parsed.data.status, target: params.id, detail: '' },
  });
  return NextResponse.json({ ok: true });
}
