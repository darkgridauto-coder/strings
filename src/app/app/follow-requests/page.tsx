'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type Req = { id: string; follower: { id: string; handle: string; displayName: string; bio: string } };

export default function Page() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  async function load() {
    try {
      const r = await fetch('/api/follow/requests');
      const d = await r.json();
      if (d.ok) setRequests(d.requests);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function respond(id: string, action: 'accept' | 'reject') {
    const r = await fetch(`/api/follow/requests/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    });
    if (r.ok) {
      showToast(action === 'accept' ? 'Request accepted' : 'Request declined');
      setRequests(requests.filter((x) => x.id !== id));
    } else showToast('Failed');
  }

  return (
    <>
      <header className="topbar">
        <Link href="/app/notifications" style={{ padding: 8 }} aria-label="Back"><Icon name="back" size={20} /></Link>
        <h1>Follow requests</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        {loading ? (
          <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Loading…</p>
        ) : requests.length === 0 ? (
          <EmptyState icon="users" title="No pending requests">
            When someone asks to follow your private account, their request will appear here.
          </EmptyState>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href={`/app/u/${req.follower.handle}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={req.follower.displayName} />
                <div>
                  <b>{req.follower.displayName}</b>
                  <div className="muted" style={{ fontSize: '.85em' }}>@{req.follower.handle}</div>
                </div>
              </Link>
              {req.follower.bio && <p className="muted" style={{ margin: 0, fontSize: '.9em' }}>{req.follower.bio}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" onClick={() => respond(req.id, 'accept')}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => respond(req.id, 'reject')}>Decline</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
