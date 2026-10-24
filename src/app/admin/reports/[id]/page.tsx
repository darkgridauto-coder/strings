'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

type Note = { t: string; by: string; tm: number };
type Data = {
  report: {
    id: string; reason: string; targetType: string; targetId: string;
    status: string; severity: string; resolution: string;
    assigneeId: string | null; notes: Note[];
    createdAt: string;
  };
  reporter: { handle: string; displayName: string } | null;
  assignee: { handle: string; displayName: string } | null;
  staffUsers: { id: string; handle: string; displayName: string }[];
  target: any;
};

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [severity, setSeverity] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [note, setNote] = useState('');
  const [action, setAction] = useState('dismiss');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/admin/reports/${params.id}`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.ok) {
        setData(d);
        setSeverity(d.report.severity || 'Medium');
        setAssigneeId(d.report.assigneeId || '');
      }
    });
  }
  useEffect(() => { load(); }, [params.id]);

  async function saveCase() {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/reports/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity, assigneeId: assigneeId || null, note: note.trim() || undefined }),
      });
      const d = await r.json();
      if (!d.ok) { showToast(d.error || 'Failed'); setBusy(false); return; }
      showToast('Case saved');
      setNote('');
      load();
    } catch { showToast('Network error'); }
    finally { setBusy(false); }
  }

  async function decide() {
    if (reason.length < 5) { showToast('Add a reason of at least 5 characters'); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/reports/${params.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const d = await r.json();
      if (!d.ok) { showToast(d.error || 'Failed'); setBusy(false); return; }
      showToast('Decision recorded');
      router.push('/admin/reports');
    } catch { showToast('Network error'); setBusy(false); }
  }

  return (
    <>
      <Link href="/admin/reports" style={{ color: 'var(--tx-2)', fontSize: '.9em' }}>← Back to reports</Link>
      {!data && <p style={{ color: 'var(--tx-2)', marginTop: 12 }}>Loading…</p>}
      {data && (
        <>
          <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <b style={{ fontFamily: 'monospace' }}>{data.report.id}</b>
              <span style={{ padding: '3px 10px', borderRadius: 10, background: 'var(--bg-3)', fontSize: '.78rem', fontWeight: 600 }}>{data.report.status}</span>
            </div>
            <p style={{ color: 'var(--tx-2)', fontSize: '.9em', marginBottom: 12 }}>
              Target: <code>{data.report.targetType}:{data.report.targetId}</code>
              {' · '}Reporter: @{data.reporter?.handle || 'unknown'}
              {' · '}{new Date(data.report.createdAt).toLocaleString()}
            </p>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{data.report.reason}</p>
          </div>

          {data.target && data.report.targetType === 'post' && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1em' }}>Reported content</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.target.body}</p>
              <p style={{ color: 'var(--tx-2)', fontSize: '.85em', marginTop: 8 }}>By @{data.target.author?.handle || 'unknown'}</p>
            </div>
          )}

          <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1em' }}>Case metadata</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Severity</span>
                <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </label>
              <label>
                <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Assignee</span>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
                  <option value="">Unassigned</option>
                  {data.staffUsers.map(s => (
                    <option key={s.id} value={s.id}>@{s.handle}</option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Add a note</span>
              <input value={note} onChange={e => setNote(e.target.value.slice(0, 500))} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }} />
            </label>
            <button onClick={saveCase} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>
              {busy ? 'Saving…' : 'Save case'}
            </button>
          </div>

          {data.report.notes.length > 0 && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1em' }}>Case notes</h3>
              {data.report.notes.map((n, i) => (
                <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? '1px solid var(--line)' : 0, fontSize: '.9em' }}>
                  <p style={{ margin: 0 }}>{n.t}</p>
                  <small style={{ color: 'var(--tx-2)' }}>{new Date(n.tm).toLocaleString()} · {n.by}</small>
                </div>
              ))}
            </div>
          )}

          <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1em' }}>Decision</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
              <label>
                <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Action</span>
                <select value={action} onChange={e => setAction(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
                  <option value="dismiss">Dismiss</option>
                  <option value="resolve">Resolve (no action)</option>
                  <option value="remove-content">Remove content</option>
                  <option value="suspend-account">Suspend account</option>
                  <option value="escalate">Escalate (in review)</option>
                </select>
              </label>
              <label>
                <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Reason (recorded in audit log)</span>
                <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, 300))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)', resize: 'vertical' }} />
              </label>
            </div>
            <button onClick={decide} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>
              {busy ? 'Working…' : 'Record decision'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
