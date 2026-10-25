import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  let status = 200;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { ok: true, detail: Date.now() - start + 'ms' };
  } catch (e: any) {
    checks.db = { ok: false, detail: e?.message?.slice(0, 100) || 'unreachable' };
    status = 503;
  }

  try {
    const sessionCount = await prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } });
    checks.sessions = { ok: true, detail: sessionCount + ' active' };
  } catch (e: any) {
    checks.sessions = { ok: false, detail: 'count failed' };
  }

  try {
    const userCount = await prisma.user.count();
    checks.users = { ok: true, detail: userCount + ' total' };
  } catch {
    checks.users = { ok: false, detail: 'count failed' };
  }

  checks.env = {
    ok: !!process.env.JWT_SECRET && !!process.env.DATABASE_URL,
    detail: process.env.JWT_SECRET ? 'configured' : 'JWT_SECRET missing',
  };

  checks.push = { ok: !!process.env.VAPID_PUBLIC_KEY, detail: process.env.VAPID_PUBLIC_KEY ? 'configured' : 'VAPID missing' };
  checks.email = { ok: !!process.env.BREVO_API_KEY, detail: process.env.BREVO_API_KEY ? 'configured' : 'BREVO missing' };
  checks.calls = { ok: !!process.env.LIVEKIT_API_KEY, detail: process.env.LIVEKIT_API_KEY ? 'configured' : 'LiveKit missing' };

  const allOk = Object.values(checks).every((c) => c.ok);
  if (!allOk) status = 503;

  return NextResponse.json({
    ok: allOk,
    service: 'strings-api',
    version: process.env.npm_package_version || '0.1.0',
    time: new Date().toISOString(),
    checks,
  }, { status });
}
