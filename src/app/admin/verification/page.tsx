'use client';
import { useEffect, useState } from 'react';
import { Table, Badge } from '@/components/admin/ui';

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    fetch('/api/admin/verifications')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) setItems(d.verifications); })
    .catch(() => console.error('Failed to load verifications'));
  }, []);

  const filtered = items.filter(i => i.status === tab);

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Verification</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'verified', 'rejected'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid var(--b3)', background: tab === t ? 'var(--tx)' : 'none', color: tab === t ? 'var(--bg)' : 'var(--tx)', fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer' }}>
            {t} · {items.filter(i => i.status === t).length}
          </button>
        ))}
      </div>

      <Table 
        headers={['Account', 'Tier', 'Submitted', '']}
        rows={filtered.map(i => [
          <div><b>@{i.user.handle}</b><br /><small style={{ color: 'var(--t2)' }}>{i.user.displayName}</small></div>,
          <Badge variant="neutral">{i.tier}</Badge>,
          new Date(i.submittedAt).toLocaleDateString(),
          tab === 'pending' ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--tx)', color: 'var(--bg)', border: 0, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
              <button style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--b3)', color: 'var(--tx)', border: 0, fontWeight: 600, cursor: 'pointer' }}>Decline</button>
            </div>
          ) : null
        ])}
        emptyMsg={`No ${tab} requests.`}
      />
    </>
  );
}
