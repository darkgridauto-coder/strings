'use client';
import { useEffect, useState } from 'react';

type Req = {
  id: string; type: string; status: string;
  identityVerified: boolean; dueAt: string; notes: string;
  createdAt: string;
  user: { handle: string; displayName: string };
};

const STATUSES = ['Received', 'Verifying', 'In progress', 'Completed', 'Rejected'];

export default function Page() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selected, setSelected] = useState<Req | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/privacy').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setRequests(d.requests || []); }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Privacy requests</h2>
      <div style={{ borderLeft: '3px solid var(--tx)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '0 12px 12px 0', margin: '12px 0', fontSize: '.9em' }}>
        This tracks DSAR requests and their verification. Access to personal data stays limited. Export and deletion jobs must be performed by the platform backend.
      </div>

      <button onClick={() => setLogging(true)} style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', marginBottom: 14 }}>
        Log request
      </button>

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {!loading && requests.length === 0 && <p style={{ color: 'var(--tx-2)', padding: 24 }}>No requests logged.</p>}

      {!loading && requests.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>ID</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Type</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Account</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Identity</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Due</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Status</th>
                <th style={{ padding: '11px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '.82em' }}>{r.id.slice(-8)}</td>
                  <td style={{ padding: '11px 14px' }}>{r.type}</td>
                  <td style={{ padding: '11px 14px' }}>@{r.user.handle}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: r.identityVerified ? '#0a7a3d' : '#b3261e',
                      color: '#fff',
                    }}>{r.identityVerified ? 'Verified' : 'Not verified'}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--tx-2)', fontSize: '.85em' }}>{new Date(r.dueAt).toLocaleDateString()}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: r.status === 'Completed' ? '#0a7a3d' : 'var(--bg-3)',
                      color: r.status === 'Completed' ? '#fff' : 'inherit',
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => setSelected(r)} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logging && <LogModal onClose={() => setLogging(false)} onDone={() => { setLogging(false); load(); }} />}
      {selected && <UpdateModal req={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load(); }} />}
    </>
  );
}

function LogModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState('Data export');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    if (!handle.trim()) { setErr('Enter a username'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/privacy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, handle: handle.trim() }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 420, width: '100%' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.15em' }}>Log privacy request</h2>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Type</span>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            <option>Data export</option><option>Account deletion</option><option>Correction</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Username</span>
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@handle" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }} />
        </label>
        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>{busy ? 'Logging…' : 'Log'}</button>
        </div>
      </div>
    </div>
  );
}

function UpdateModal({ req, onClose, onDone }: { req: Req; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState(req.status);
  const [verified, setVerified] = useState(req.identityVerified);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    if (status === 'Completed' && !verified) { setErr('Verify identity before completing'); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/privacy/${req.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, identityVerified: verified }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 420, width: '100%' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15em' }}>{req.type}</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--tx-2)', fontSize: '.88em' }}>@{req.user.handle}</p>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Status</span>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} style={{ width: 'auto' }} />
          Identity verified
        </label>
        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
