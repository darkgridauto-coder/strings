'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconName } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { useUser } from '@/components/UserProvider';
import { VerifiedSeal } from '@/components/ui/VerifiedSeal';

type Nav = { icon: IconName; label: string; href: string };

const MAIN: Nav[] = [
  { icon: 'home', label: 'Home', href: '/app' },
  { icon: 'search', label: 'Explore', href: '/app/explore' },
  { icon: 'plus', label: 'Create', href: '/app/posts/new' },
  { icon: 'chat', label: 'Messages', href: '/app/messages' },
  { icon: 'user', label: 'Profile', href: '/app/profile' },
];
const SUB: Nav[] = [
  { icon: 'bell', label: 'Activity', href: '/app/notifications' },
  { icon: 'save', label: 'Saved', href: '/app/saved' },
  { icon: 'gear', label: 'Settings', href: '/app/settings' },
  { icon: 'help', label: 'Help', href: '/app/help' },
];

function isActive(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const { user } = useUser();
  return (
    <aside className="sidebar">
      <div className="brand">Strings</div>
      <nav>
        {MAIN.map((n) => (
          <Link key={n.href} href={n.href} className={`nav-link${isActive(pathname, n.href) ? ' active' : ''}`}>
            <Icon name={n.icon} /><span>{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="nav-sub">
        {SUB.map((n) => (
          <Link key={n.href} href={n.href} className={`nav-link${isActive(pathname, n.href) ? ' active' : ''}`}>
            <Icon name={n.icon} /><span>{n.label}</span>
          </Link>
        ))}
      </div>
      {user && (
        <Link
          href="/app/profile"
          style={{
            marginTop: 'auto',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: 8, borderRadius: 16, border: '1px solid var(--ln)',
          }}
        >
          <Avatar name={user.displayName} src={user.avatar || undefined} size="sm" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 650, fontSize: '.9em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {user.displayName}
              {(user as any).verifiedTier ? <VerifiedSeal tier={(user as any).verifiedTier} size={14} /> : null}
            </div>
            <div style={{ color: 'var(--t2)', fontSize: '.8em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{user.handle}</div>
          </div>
        </Link>
      )}
    </aside>
  );
}
