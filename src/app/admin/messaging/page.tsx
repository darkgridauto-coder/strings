'use client';
import { useEffect, useState } from 'react';

type Counts = { total: number; groups: number; dm: number; messages: number; pending: number; locked: number };

function KPI({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 18, padding: 16 }}>
      <small style={{ display: 'block', color: 'var(--tx-2)' }}>{label}</small>
      <b style={{ fontSize: '1.7rem', letterSpacing: '-.04em', display: 'block', margin: '2px 0' }}>{value}</b>
      {sub && <small style={{ color: 'var(--tx-2)' }}>{sub}</small>}
    </div>
  );
}

export default function Page() {
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    fetch('/api/admin/messaging').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setC(d.counts); });
  }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Messaging</h2>
      <div style={{ borderLeft: '3px solid var(--tx)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '0 12px 12px 0', margin: '12px 0', fontSize: '.9em' }}>
        <b>Privacy:</b> staff cannot read message content. This page shows counts and flags only, and no tool here bypasses encryption. Abuse is handled through user reports and evidence people choose to submit.
      </div>

      {!c && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {c && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '14px 0' }}>
          <KPI label="Total conversations" value={c.total} sub={`${c.dm} direct · ${c.groups} groups`} />
          <KPI label="Messages sent" value={c.messages} />
          <KPI label="Pending requests" value={c.pending} />
          <KPI label="Locked chats" value={c.locked} sub="not implemented yet" />
        </div>
      )}

      <div style={{ borderLeft: '3px solid var(--tx)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '0 12px 12px 0', marginTop: 14, fontSize: '.9em' }}>
        <b>Not measured:</b> delivery failures, queue depth, latency. This prototype has no messaging server — Socket.IO provides signaling only.
      </div>
    </>
  );
}
