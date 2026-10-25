import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/requirePermission';

const DEFAULTS: Record<string, string> = {
  signups: '1', posting: '1', verif: '1', pro: '1', banner: '',
};

export async function GET() {
  const auth = await requirePermission('overview');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const rows = await prisma.platformSetting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  rows.forEach(r => { map[r.key] = r.value; });
  return NextResponse.json({ ok: true, platform: map });
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('overview');
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 403 });
  const body = await req.json();
  const updates: Array<{ key: string; value: string }> = [];
  for (const [k, v] of Object.entries(body)) {
    if (typeof v === 'boolean') updates.push({ key: k, value: v ? '1' : '0' });
    else if (typeof v === 'string' && ['signups', 'posting', 'verif', 'pro', 'banner'].includes(k)) updates.push({ key: k, value: v });
  }
  if (!updates.length) return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });

  await Promise.all(updates.map(u => prisma.platformSetting.upsert({
    where: { key: u.key }, create: u, update: { value: u.value },
  })));
  await prisma.adminAction.create({
    data: { actorId: auth.userId, action: 'Updated platform settings', target: 'platform', detail: JSON.stringify(body).slice(0, 200) },
  });
  return NextResponse.json({ ok: true });
}
