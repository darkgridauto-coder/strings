'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Report = {
  id: string; reason: string; targetType: string; targetId: string;
  status: string; severity: string; createdAt: string;
  assigneeId: string | null;
  reporter: { handle: string; displayName: string } | null;
  assignee: { handle: string; displayName: string } | null;
};

const SEVERITY_COLOR: Record<string, { bg: string; fg: string }> = {
  High:   { bg: '#b3261e', fg: '#fff' },
  Medium: { bg: '#c9a227', fg: '#fff' },
  Low:    { bg: 'var(--bg-3)', fg: 'var(--tx)' },
};

export default function Page() {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState('open');
  const [severity, setSeverity] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status, severity, q });
    fetch(`/api/admin/reports?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.ok) setReports(d.reports || []); })
      .finally(() => setLoading(false));
  }, [status, severity, q]);

  const tabs: [string, string][] = [
    ['open', 'Open'], ['in-review', 'In review'],
    ['resolved', 'Resolved'], ['dismissed', 'Dismissed'], ['all', 'All'],
  ];

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Reports &amp; cases</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Targets are linked to real posts and accounts. Deadlines: High 24h, Medium 72h, Low 7 days.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setStatus(k)} style={{
            padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            background: status === k ? 'var(--tx)' : 'var(--bg-2)',
            color: status === k ? 'var(--bg)' : 'inherit',
            border: 0, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search reason, target, or id"
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}
        />
        <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
          <option value="all">All severities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {!loading && reports.length === 0 && <p style={{ color: 'var(--tx-2)', padding: 24 }}>No reports in this view.</p>}

      {!loading && reports.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>ID</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Reason</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Target</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Severity</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Assignee</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Reporter</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Status</th>
                <th style={{ padding: '11px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const sev = SEVERITY_COLOR[r.severity] || SEVERITY_COLOR.Medium;
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '.82em' }}>{r.id.slice(0, 8)}</td>
                    <td style={{ padding: '11px 14px' }}>{r.reason.slice(0, 60)}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{r.targetType}:{r.targetId.slice(0, 8)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                        background: sev.bg, color: sev.fg,
                      }}>{r.severity}</span>
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{r.assignee ? '@' + r.assignee.handle : '—'}</td>
                    <td style={{ padding: '11px 14px' }}>@{r.reporter?.handle || 'unknown'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600, background: 'var(--bg-3)' }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Link href={`/admin/reports/${r.id}`} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600 }}>Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
