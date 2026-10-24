'use client';
import { useEffect, useState } from 'react';
import { Table, Badge } from '@/components/admin/ui';

export default function Page() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/subscriptions')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) setSubs(d.subscriptions); })
    .catch(() => console.error('Failed to load subscriptions'));
  }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Subscriptions</h2>
      <p style={{ color: 'var(--t2)', marginBottom: 16 }}>Revenue is not measured. Plans below are the records stored by the app.</p>
      
      <Table 
        headers={['Account', 'Kind', 'Plan', 'Status', 'Renews']}
        rows={subs.map(s => [
          `@${s.user.handle}`,
          s.kind,
          s.plan,
          <Badge>{s.status}</Badge>,
          new Date(s.renewsAt).toLocaleDateString()
        ])}
        emptyMsg="No subscriptions."
      />
    </>
  );
}
