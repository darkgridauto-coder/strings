import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function requireAdmin(): Promise<
  { ok: true; userId: string; role: string; staffRole: string } | { ok: false; error: string }
> {
  const s = getSession();
  if (!s) return { ok: false, error: 'Not signed in' };
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { id: true, role: true, staffRole: true },
  });
  if (!user) return { ok: false, error: 'User not found' };
  if (user.role !== 'admin' && !user.staffRole) {
    return { ok: false, error: 'Not authorized' };
  }
  return { ok: true, userId: user.id, role: user.role, staffRole: user.staffRole };
}
