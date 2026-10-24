'use client';
import { useEffect, useState } from 'react';
import { KPI } from '@/components/admin/ui';
import Link from 'next/link';

export default function Page() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/overview')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) { setStats(d.stats); setRecent(d.recentActions || []); } })
    .catch(() => console.error('Failed to load admin overview'));
  }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 6px' }}>Overview</h2>
      <p style={{ color: 'var(--t2)', marginBottom: 20 }}>Live figures from the Strings app. Nothing here is simulated.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '14px 0' }}>
        <KPI label="Users" value={stats?.users ?? '—'} sub={`${stats?.suspendedUsers ?? 0} suspended`} />
        <KPI label="Posts" value={stats?.posts ?? '—'} sub={`${stats?.removedPosts ?? 0} removed`} />
        <KPI label="Comments" value={stats?.comments ?? '—'} />
        <KPI label="Conversations" value={stats?.conversations ?? '—'} sub={`${stats?.messages ?? 0} messages`} />
        <KPI label="Open reports" value={stats?.openReports ?? '—'} sub="needs review" />
        <KPI label="Pending verification" value={stats?.pendingVerifs ?? '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        <div style={{ background: 'var(--b2)', borderRadius: 20, padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1em', textTransform: 'none' }}>Needs attention</h3>
          <div className="kv"><span style={{ color: 'var(--t2)' }}>Open reports</span><b>{stats?.openReports} <Link href="/admin/reports">Open</Link></b></div>
          <div className="kv"><span style={{ color: 'var(--t2)' }}>Verification requests</span><b>{stats?.pendingVerifs} <Link href="/admin/verification">Open</Link></b></div>
        </div>
        <div style={{ background: 'var(--b2)', borderRadius: 20, padding: 18 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1em', textTransform: 'none' }}>Recent administrative activity</h3>
          {recent.length === 0 ? <p style={{ color: 'var(--t2)' }}>None yet.</p> : recent.map((a: any) => (
            <div key={a.id} className="kv"><span style={{ color: 'var(--t2)' }}>{a.action}</span><b>{a.target}</b></div>
          ))}
        </div>
      </div>
    </>
  );
}
