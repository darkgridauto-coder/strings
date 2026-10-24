import { requireAdmin } from '@/lib/requireAdmin';
import { can } from '@/lib/permissions';

export async function requirePermission(permission: string): Promise<
  | { ok: true; userId: string; role: string; staffRole: string }
  | { ok: false; error: string }
> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const effectiveRole = auth.staffRole || (auth.role === 'admin' ? 'owner' : '');
  if (!can(effectiveRole, permission)) {
    return { ok: false, error: 'Insufficient permissions for this action' };
  }
  return auth;
}
