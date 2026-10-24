'use client';
import { useEffect, useState } from 'react';

type Bar = { label: string; value: number };
type Data = {
  kpi: { users: number; posts: number; likes: number; comments: number; reports: number; resolvedReports: number; modActions: number; suspendedUsers: number };
  byAuthor: Bar[];
  byCategory: Bar[];
  byDay: Bar[];
};

function Bars({ items }: { items: Bar[] }) {
  if (!items.length) return <p style={{ color: 'var(--tx-2)' }}>No data yet.</p>;
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <div>
      {items.map(i => (
        <div key={i.label} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 40px', gap: 10, alignItems: 'center', margin: '8px 0', fontSize: '.86rem' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.label}</span>
          <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
            <i style={{ display: 'block', height: '100%', background: 'var(--tx)', width: Math.round(i.value / max * 100) + '%' }} />
          </div>
          <b style={{ textAlign: 'right' }}>{i.value}</b>
        </div>
      ))}
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 18, padding: 16 }}>
      <small style={{ display: 'block', color: 'var(--tx-2)' }}>{label}</small>
      <b style={{ fontSize: '1.7rem', letterSpacing: '-.04em', display: 'block', margin: '2px 0' }}>{value}</b>
      {sub && <small style={{ color: 'var(--tx-2)' }}>{sub}</small>}
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setData(d); });
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows: (string | number)[][] = [
      ['Metric', 'Value'],
      ['Users', data.kpi.users],
      ['Posts', data.kpi.posts],
      ['Likes', data.kpi.likes],
      ['Comments', data.kpi.comments],
      ['Reports', data.kpi.reports],
      ['Resolved reports', data.kpi.resolvedReports],
      ['Suspended accounts', data.kpi.suspendedUsers],
      ['Moderation actions', data.kpi.modActions],
      ['Exported at', new Date().toISOString()],
    ];
    const q = (s: any) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const blob = new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'strings-analytics.csv';
    a.click();
  }

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Analytics</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Measured: counts taken from the live database. Unavailable: anything needing history or a background worker.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={exportCsv} style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', fontWeight: 600, border: 0, cursor: 'pointer' }}>
          Export summary (CSV)
        </button>
      </div>

      {!data && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '14px 0' }}>
            <KPI label="Users" value={data.kpi.users} />
            <KPI label="Posts" value={data.kpi.posts} />
            <KPI label="Likes" value={data.kpi.likes} />
            <KPI label="Reports" value={data.kpi.reports} sub={`${data.kpi.resolvedReports} resolved`} />
            <KPI label="Moderation actions" value={data.kpi.modActions} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, margin: '14px 0' }}>
            <div style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 18 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-2)' }}>Posts by account</h3>
              <Bars items={data.byAuthor} />
            </div>
            <div style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 18 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-2)' }}>Reports by target type</h3>
              <Bars items={data.byCategory} />
            </div>
            <div style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 18 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-2)' }}>Admin actions by day</h3>
              <Bars items={data.byDay} />
            </div>
          </div>

          <div style={{ borderLeft: '3px solid var(--tx)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '0 12px 12px 0', marginTop: 14, fontSize: '.9em' }}>
            <b>Not measured:</b> user growth over time (no registration date indexes), active users, delivery and call metrics, resolution-time trends. These would need a metrics pipeline.
          </div>
        </>
      )}
    </>
  );
}
