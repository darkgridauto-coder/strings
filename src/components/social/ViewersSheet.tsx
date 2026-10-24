'use client';
import { useEffect, useState } from 'react';
import { useSheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';

type Viewer = { id: string; handle: string; displayName: string; avatar?: string | null; viewedAt: string };

export function ViewersSheet({ statusId, viewCount }: { statusId: string; viewCount: number }) {
  const { closeSheet } = useSheet();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/statuses/${statusId}/viewers`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setViewers(d.viewers || []); })
      .finally(() => setLoading(false));
  }, [statusId]);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Viewed by · {viewCount}</h3>
      {loading && <p className="muted">Loading…</p>}
      {!loading && viewers.length === 0 && (
        <p className="muted">No views yet. When followers see this status, they will appear here.</p>
      )}
      {viewers.map((v) => (
        <div key={v.id} className="row" style={{ cursor: 'default', borderBottom: 0 }}>
          <Avatar name={v.displayName} src={v.avatar || undefined} />
          <div className="row-body">
            <span className="row-title">{v.displayName}</span>
            <span className="row-sub">@{v.handle} · {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      ))}
      <button className="btn o" onClick={closeSheet}>Close</button>
    </div>
  );
}
