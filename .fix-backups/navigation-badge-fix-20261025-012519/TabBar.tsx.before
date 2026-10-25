'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconName } from '@/components/ui/Icon';
import { NotificationBadge } from '@/components/NotificationBadge';

const TABS: { icon: IconName; label: string; href: string; compose?: boolean }[] = [
  { icon: 'home', label: 'Home', href: '/app' },
  { icon: 'search', label: 'Explore', href: '/app/explore' },
  { icon: 'plus', label: 'Create', href: '/app/posts/new', compose: true },
  { icon: 'chat', label: 'Messages', href: '/app/messages' },
  { icon: 'user', label: 'Profile', href: '/app/profile' },
];

function isActive(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(href + '/');
}

export function TabBar() {
  const pathname = usePathname() ?? '';
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-label={t.label}
          className={`${isActive(pathname, t.href) ? 'active' : ''}${t.compose ? ' compose' : ''}`}
        >
          <NotificationBadge type={t.label === 'Messages' ? 'messages' : t.label === 'Activity' ? 'notifications' : 'messages'}>
          <Icon name={t.icon} size={22} />
        </NotificationBadge>
        </Link>
      ))}
    </nav>
  );
}
