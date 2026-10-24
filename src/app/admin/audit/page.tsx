'use client';
import { useEffect, useState } from 'react';
import { Table } from '@/components/admin/ui';

export default function Page() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/audit')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) setItems(d.actions); })
    .catch(() => console.error('Failed to load audit log'));
  }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Audit & security</h2>
      <div style={{ marginBottom: 16 }}>
        <a href="/api/admin/audit?format=csv" download style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', fontWeight: 600, textDecoration: 'none' }}>Export CSV</a>
      </div>
      
      <Table 
        headers={['Time', 'Action', 'Target']}
        rows={items.map(a => [
          <span style={{ color: 'var(--t2)' }}>{new Date(a.createdAt).toLocaleString()}</span>,
          a.action,
          <span style={{ fontFamily: 'monospace' }}>{a.target}</span>
        ])}
        emptyMsg="No actions recorded."
      />
    </>
  );
}
