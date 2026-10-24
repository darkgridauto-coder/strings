'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Icon, IconName } from '@/components/ui/Icon';
import { useUser } from '@/components/UserProvider';

type ModItem = [label: string, href: string, icon: IconName];

const MODS: [string, ModItem[]][] = [
  ['Operate', [
    ['Overview',          '/admin',              'home'],
    ['Reports & cases',   '/admin/reports',      'doc'],
    ['Content',           '/admin/content',      'doc'],
    ['Guideline review',  '/admin/review',       'shield'],
    ['Users',             '/admin/users',        'users'],
    ['Verification',      '/admin/verification', 'shield'],
    ['Support',           '/admin/support',      'help'],
  ]],
  ['Platform', [
    ['Messaging',           '/admin/messaging',      'chat'],
    ['Voice & video',       '/admin/calling',        'phone'],
    ['Announcements',       '/admin/announcements',  'bell'],
    ['Platform settings',   '/admin/platform',       'filter'],
    ['Subscriptions',       '/admin/subscriptions',  'crown'],
  ]],
  ['Insight', [
    ['Analytics',         '/admin/analytics',  'chart'],
    ['Health & incidents','/admin/health',     'alert'],
    ['Privacy requests',  '/admin/privacy',    'lock'],
  ]],
  ['Govern', [
    ['Staff & roles',   '/admin/staff',     'users'],
    ['Audit & security','/admin/audit',     'clock'],
    ['Build checklist', '/admin/checklist', 'check'],
  ]],
];

const ALL_ITEMS = MODS.flatMap(([, items]) => items);

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { user } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark' | 'oled'>('light');
  const [counts, setCounts] = useState<{ openReports: number; pendingVerifs: number; pendingReviews: number; openSupport: number }>({ openReports: 0, pendingVerifs: 0, pendingReviews: 0, openSupport: 0 });

  useEffect(() => {
    fetch('/api/admin/counts').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setCounts(d.counts); }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin.theme') as any;
      if (saved === 'dark' || saved === 'oled' || saved === 'light') setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('admin.theme', theme); } catch {}
  }, [theme]);

  function cycle() {
    setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'oled' : 'light');
  }

  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  const current = ALL_ITEMS.find(([, href]) => isActive(href));
  const badgeFor = (href: string) => {
    if (href === '/admin/reports') return counts.openReports;
    if (href === '/admin/verification') return counts.pendingVerifs;
    if (href === '/admin/review') return counts.pendingReviews;
    if (href === '/admin/support') return counts.openSupport;
    return 0;
  };
  const currentLabel = current ? current[0] : 'Overview';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '264px minmax(0,1fr)', height: '100dvh', background: 'var(--bg)' }}>
      <aside
        aria-label="Admin navigation"
        style={{
          borderRight: '1px solid var(--line)',
          padding: '20px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div style={{ fontWeight: 800, letterSpacing: '.3em', fontSize: 13, textTransform: 'uppercase', padding: '6px 12px 4px' }}>
          Strings
          <small style={{ display: 'block', letterSpacing: '.04em', textTransform: 'none', fontWeight: 500, color: 'var(--tx-2)', marginTop: 2 }}>
            Admin · @{user?.handle || 'admin'}
          </small>
        </div>
        {MODS.map(([group, items]) => (
          <div key={group}>
            <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--tx-2)', padding: '16px 12px 6px' }}>
              {group}
            </div>
            {items.map(([label, href, icon]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 12,
                    color: active ? 'var(--bg)' : 'var(--tx-2)',
                    background: active ? 'var(--tx)' : 'transparent',
                    fontWeight: 550,
                    fontSize: '.92em',
                    textDecoration: 'none',
                    transition: 'background .2s',
                  }}
                >
                  <Icon name={icon} size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {badgeFor(href) > 0 && (
                    <span style={{ fontSize: '.72rem', background: active ? 'var(--bg)' : 'var(--bg-3)', color: active ? 'var(--tx)' : 'var(--tx-2)', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>
                      {badgeFor(href)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>
      <section style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderBottom: '1px solid var(--line)',
            minHeight: 64,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '.8rem', color: 'var(--tx-2)' }}>Admin / {currentLabel}</div>
            <h1 style={{ fontSize: '1.15rem', letterSpacing: '-.02em', margin: 0, fontWeight: 700 }}>
              {currentLabel}
            </h1>
          </div>
          <span style={{ flex: 1 }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: 'var(--tx-2)' }}>
            <i style={{ width: 8, height: 8, borderRadius: '50%', background: '#0a7a3d', display: 'inline-block' }} />
            Synced
          </span>
          <button
            onClick={cycle}
            style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--bg-2)', fontWeight: 600, fontSize: '.85rem', border: 0, cursor: 'pointer', color: 'inherit' }}
          >
            Theme
          </button>
          <Link
            href="/app"
            style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--bg-2)', fontWeight: 600, fontSize: '.85rem', textDecoration: 'none', color: 'inherit' }}
          >
            Exit
          </Link>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>{children}</div>
        </div>
      </section>
    </div>
  );
}
