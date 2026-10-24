import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const attachmentSchema = z.object({
  url: z.string().min(1).max(500),
  name: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.number().int().min(0).max(10_000_000).default(0),
});

const schema = z.object({
  targetType: z.string().min(1).max(30),
  targetId: z.string().min(1).max(80),
  reason: z.string().min(3).max(1000),
  attachments: z.array(attachmentSchema).max(5).optional(),
});

export async function POST(req: NextRequest) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const { attachments, ...reportData } = parsed.data;
  const report = await prisma.report.create({
    data: {
      reporterId: s.userId,
      ...reportData,
      attachments: attachments?.length
        ? { create: attachments }
        : undefined,
    },
  });
  return NextResponse.json({ ok: true, report });
}
