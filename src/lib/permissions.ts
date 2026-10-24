export const STAFF_ROLES = ['owner', 'moderator', 'support', 'analyst', 'security'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner:     ['*'],
  moderator: ['overview', 'users', 'userview', 'content', 'reports', 'verif', 'audit', 'analytics', 'support', 'review', 'messaging'],
  support:   ['overview', 'userview', 'support', 'privacy', 'subs', 'messaging'],
  analyst:   ['overview', 'analytics', 'audit'],
  security:  ['overview', 'audit', 'analytics', 'userview', 'health'],
};

export function can(staffRole: string | null | undefined, permission: string): boolean {
  if (!staffRole) return false;
  const perms = ROLE_PERMISSIONS[staffRole] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function isValidStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}
