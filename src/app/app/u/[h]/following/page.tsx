'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';

type U = { id: string; handle: string; displayName: string; avatar?: string | null; bio?: string };

export default function Page({ params }: { params: { h: string } }) {
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${params.h}/following`).then((r) => r.json()).then((d) => { if (d.ok) setUsers(d.users); }).finally(() => setLoading(false));
  }, [params.h]);

  return (
    <>
      <header className="topbar">
        <Link href={`/app/u/${params.h}`} className="ib" aria-label="Back">←</Link>
        <h1>Following</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <p className="muted">@{params.h}</p>
        {loading && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</p>}
        {!loading && users.length === 0 && <EmptyState icon="users" title="Not following anyone yet">This account has not followed anyone.</EmptyState>}
        {users.map((u) => (
          <Link key={u.id} href={`/app/u/${u.handle}`} className="row">
            <Avatar name={u.displayName} src={u.avatar || undefined} />
            <div className="row-body">
              <span className="row-title">{u.displayName}</span>
              <span className="row-sub">@{u.handle}{u.bio ? ' · ' + u.bio.slice(0, 40) : ''}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
