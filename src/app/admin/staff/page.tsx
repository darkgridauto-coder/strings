'use client';
import { useEffect, useState } from 'react';

type Staff = {
  id: string; handle: string; displayName: string; email: string;
  role: string; staffRole: string; suspended: boolean; createdAt: string;
};

const ROLES: [string, string][] = [
  ['owner', 'Full access to everything'],
  ['moderator', 'Content, reports, users, verification'],
  ['support', 'Support, privacy, messaging, subscriptions'],
  ['analyst', 'Analytics, audit (read-only)'],
  ['security', 'Audit, analytics, health'],
];

export default function Page() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/staff').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setStaff(d.staff || []); }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Staff &amp; roles</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Least privilege: new staff receive only their role&apos;s permissions. Only existing admins can add staff.
      </p>

      <button onClick={() => setAdding(true)} style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', marginBottom: 14 }}>
        Add staff member
      </button>

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {!loading && staff.length === 0 && <p style={{ color: 'var(--tx-2)', padding: 24 }}>No staff yet.</p>}

      {!loading && staff.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Name</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Email</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Role</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Status</th>
                <th style={{ padding: '11px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <b>{s.displayName}</b>
                    <div style={{ color: 'var(--tx-2)', fontSize: '.82em' }}>@{s.handle}</div>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{s.email}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: 'var(--bg-3)',
                    }}>{s.staffRole || 'admin'}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: s.suspended ? '#b3261e' : '#0a7a3d',
                      color: '#fff',
                    }}>{s.suspended ? 'Suspended' : 'Active'}</span>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => setEditing(s)} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-2)', margin: '22px 0 10px' }}>Role permissions</h3>
      <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
              <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Role</th>
              <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Can access</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map(([r, desc]) => (
              <tr key={r} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '11px 14px', fontWeight: 600 }}>{r}</td>
                <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && <AddModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
      {editing && <EditModal staff={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />}
    </>
  );
}

function AddModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('moderator');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    if (!handle.trim()) { setErr('Enter a handle'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim(), staffRole: role }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 420, width: '100%' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.15em' }}>Add staff member</h2>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Handle of existing user</span>
          <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@handle" style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Role</span>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            {ROLES.map(([r]) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>{busy ? 'Adding…' : 'Add'}</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ staff, onClose, onDone }: { staff: Staff; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState(staff.staffRole || 'moderator');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function changeRole() {
    setErr('');
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffRole: role }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  async function deactivate() {
    if (!confirm(`Remove admin access from @${staff.handle}?`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deactivate: true }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 420, width: '100%' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15em' }}>{staff.displayName}</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--tx-2)', fontSize: '.88em' }}>@{staff.handle}</p>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Role</span>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            {ROLES.map(([r]) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={deactivate} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: '#b3261e', color: '#fff', border: 0, cursor: 'pointer', fontWeight: 600 }}>Deactivate</button>
          <button onClick={changeRole} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Save role</button>
        </div>
      </div>
    </div>
  );
}
