import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function requireVerifiedSession(): Promise<
  { ok: true; userId: string; handle: string } | { ok: false; error: string; status: number }
> {
  const s = await getSession();
  if (!s) return { ok: false, error: 'Not signed in', status: 401 };
  const u = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { emailVerified: true, suspended: true },
  });
  if (!u) return { ok: false, error: 'User not found', status: 404 };
  if (u.suspended) return { ok: false, error: 'Your account has been suspended.', status: 403 };
  if (!u.emailVerified) return { ok: false, error: 'Verify your email first', status: 403 };
  return { ok: true, userId: s.userId, handle: s.handle };
}
