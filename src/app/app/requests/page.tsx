'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useUser } from '@/components/UserProvider';

type Req = {
  id: string;
  participants: { id: string; handle: string; displayName: string; avatar?: string | null }[];
  messages: { body: string; createdAt: string }[];
};

export default function Page() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch('/api/conversations/requests')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setRequests(d.requests); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'accept' | 'decline') {
    try {
      const r = await fetch(`/api/conversations/requests/${id}/${action}`, { method: 'POST' });
      if (r.ok) { showToast(action === 'accept' ? 'Request accepted' : 'Request declined'); load(); }
      else showToast('Failed');
    } catch { showToast('Network error'); }
  }

  return (
    <>
      <header className="topbar">
        <Link href="/app/messages" className="ib" aria-label="Back">←</Link>
        <h1>Requests</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <p className="muted">Message requests from people you don&apos;t follow. Accept to reply; decline to remove.</p>
        {loading && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</p>}
        {!loading && requests.length === 0 && <EmptyState icon="chat" title="No requests">New message requests will appear here.</EmptyState>}
        {requests.map((r) => {
          const other = r.participants.find((p) => p.handle !== user?.handle) || r.participants[0];
          if (!other) return null;
          return (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href={`/app/u/${other.handle}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={other.displayName} src={other.avatar || undefined} />
                <div><b>{other.displayName}</b><div className="muted" style={{ fontSize: '.85em' }}>@{other.handle}</div></div>
              </Link>
              {r.messages[0] && <p className="muted" style={{ margin: 0, fontSize: '.92em' }}>“{r.messages[0].body.slice(0, 160)}”</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" onClick={() => act(r.id, 'accept')}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => act(r.id, 'decline')}>Decline</Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
