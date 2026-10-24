'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

type N = { id: string; kind: string; body: string; link: string; read: boolean; createdAt: string };

const iconFor = (kind: string) =>
  kind === 'follow' ? 'user' as const :
  kind === 'comment' || kind === 'mention' ? 'chat' as const :
  'heart' as const;

export default function Page() {
  const { showToast } = useToast();
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'men' | 'fol'>('all');

  function load() {
    setLoading(true);
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setItems(d.notifications); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    try { await fetch(`/api/notifications/${id}/read`, { method: 'POST' }); load(); } catch {}
  }
  async function markAll() {
    try { await fetch('/api/notifications/read-all', { method: 'POST' }); showToast('Marked all read'); load(); } catch {}
  }

  const filtered = items.filter((n) => {
    if (filter === 'men') return n.kind === 'comment' || n.kind === 'mention';
    if (filter === 'fol') return n.kind === 'follow';
    return true;
  });
  const fresh = filtered.filter((n) => !n.read);
  const older = filtered.filter((n) => n.read);

  function Row({ n }: { n: N }) {
    const unread = !n.read;
    return (
      <Link
        href={n.link || '/app'}
        onClick={() => markRead(n.id)}
        className="row"
        style={{ background: unread ? 'var(--b2)' : 'none', fontWeight: unread ? 650 : 500 }}
      >
        <Icon name={iconFor(n.kind)} />
        <div className="row-body">
          <span className="row-title">
            {unread && <span className="badge" style={{ marginRight: 8 }}>New</span>}
            {n.body}
          </span>
          <span className="row-sub">{new Date(n.createdAt).toLocaleString()}</span>
        </div>
        {unread ? <div className="dot" /> : null}
      </Link>
    );
  }

  return (
    <>
      <header className="topbar">
        <span style={{ width: 42 }} />
        <h1 className="left">Activity</h1>
        <div className="topbar-actions">
          <button className="ib" onClick={markAll} aria-label="Mark all read"><Icon name="check" /></button>
        </div>
      </header>
      <div className="page">
        <div className="seg">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'men' ? 'on' : ''} onClick={() => setFilter('men')}>Mentions</button>
          <button className={filter === 'fol' ? 'on' : ''} onClick={() => setFilter('fol')}>Follows</button>
        </div>

        {loading && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</p>}

        {!loading && filtered.length === 0 && (
          <EmptyState icon="bell" title="No activity yet">
            When people like, comment on, or follow you, it will appear here.
          </EmptyState>
        )}

        {!loading && fresh.length > 0 && (
          <>
            <h3>New</h3>
            {fresh.map((n) => <Row key={n.id} n={n} />)}
          </>
        )}

        {!loading && older.length > 0 && (
          <>
            <h3>Earlier</h3>
            {older.map((n) => <Row key={n.id} n={n} />)}
          </>
        )}
      </div>
    </>
  );
}
