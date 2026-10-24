'use client';
import { useEffect, useState } from 'react';

type Incident = {
  id: string; title: string; severity: string; status: string;
  updates: { t: string; tm: number }[];
  createdAt: string; updatedAt: string;
};

export default function Page() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/incidents').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setIncidents(d.incidents || []); }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Health &amp; incidents</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Incident tracking. Real infrastructure health (DB latency, call quality, queue depth) needs a backend metrics pipeline and is not shown here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, margin: '14px 0' }}>
        {[
          ['App database', 'Connected', 'SQLite via Prisma'],
          ['Backend / API', 'Live', 'Next.js routes'],
          ['Real-time', 'Live', 'Socket.IO signaling'],
          ['Job queues', 'N/A', 'None configured'],
        ].map(([l, v, sub]) => (
          <div key={l} style={{ background: 'var(--bg-2)', borderRadius: 18, padding: 16 }}>
            <small style={{ display: 'block', color: 'var(--tx-2)' }}>{l}</small>
            <b style={{ fontSize: '1.2rem', display: 'block', margin: '2px 0' }}>{v}</b>
            <small style={{ color: 'var(--tx-2)' }}>{sub}</small>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-2)' }}>Incidents</h3>
        <button onClick={() => setCreating(true)} style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem' }}>
          New incident
        </button>
      </div>

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {!loading && incidents.length === 0 && <p style={{ color: 'var(--tx-2)', padding: 24 }}>No incidents recorded. That&apos;s a good thing.</p>}

      {!loading && incidents.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>ID</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Title</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Severity</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Status</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Updated</th>
                <th style={{ padding: '11px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(i => (
                <tr key={i.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '.82em' }}>{i.id.slice(-6)}</td>
                  <td style={{ padding: '11px 14px' }}>{i.title}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: i.severity === 'SEV1' ? '#b3261e' : i.severity === 'SEV2' ? '#c9a227' : 'var(--bg-3)',
                      color: i.severity === 'SEV3' ? 'inherit' : '#fff',
                    }}>{i.severity}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: i.status === 'Resolved' ? '#0a7a3d' : 'var(--bg-3)',
                      color: i.status === 'Resolved' ? '#fff' : 'inherit',
                    }}>{i.status}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--tx-2)', fontSize: '.85em' }}>{new Date(i.updatedAt).toLocaleString()}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => setSelected(i)} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <NewIncidentModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); }} />}
      {selected && <IncidentModal incident={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load(); }} />}
    </>
  );
}

function NewIncidentModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('SEV3');
  const [firstUpdate, setFirstUpdate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    if (title.trim().length < 3) { setErr('Title too short'); return; }
    if (firstUpdate.trim().length < 5) { setErr('Add a first update'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/incidents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), severity, firstUpdate: firstUpdate.trim() }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 520, width: '100%' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.15em' }}>New incident</h2>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Title</span>
          <input value={title} onChange={e => setTitle(e.target.value.slice(0, 120))} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Severity</span>
          <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            <option>SEV3</option><option>SEV2</option><option>SEV1</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>First update</span>
          <textarea value={firstUpdate} onChange={e => setFirstUpdate(e.target.value.slice(0, 1000))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)', resize: 'vertical' }} />
        </label>
        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>{busy ? 'Creating…' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}

function IncidentModal({ incident, onClose, onDone }: { incident: Incident; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState(incident.status);
  const [update, setUpdate] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/incidents/${incident.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, update: update || undefined }),
      });
      if (r.ok) onDone(); else setBusy(false);
    } catch { setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15em' }}>{incident.title}</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--tx-2)', fontSize: '.88em' }}>{incident.severity} · Opened {new Date(incident.createdAt).toLocaleString()}</p>

        <h3 style={{ margin: '0 0 8px', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tx-2)' }}>Updates</h3>
        {incident.updates.map((u, i) => (
          <p key={i} style={{ margin: '4px 0', padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 8, fontSize: '.85em' }}>
            <b style={{ color: 'var(--tx-2)', fontWeight: 500 }}>{new Date(u.tm).toLocaleString()}</b> · {u.t}
          </p>
        ))}

        <label style={{ display: 'block', margin: '14px 0 8px' }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Status</span>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            <option>Investigating</option><option>Identified</option><option>Monitoring</option><option>Resolved</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>New update</span>
          <textarea value={update} onChange={e => setUpdate(e.target.value.slice(0, 1000))} rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)', resize: 'vertical' }} />
        </label>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Close</button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
