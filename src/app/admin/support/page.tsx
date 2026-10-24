'use client';
import { useEffect, useState } from 'react';

type Ticket = {
  id: string; category: string; subject: string; body: string;
  status: string; priority: string; assigneeId: string | null;
  reply: string; notes: { t: string; by: string; tm: number }[];
  createdAt: string;
  user: { handle: string; displayName: string };
};

type Tab = 'open' | 'in-progress' | 'resolved';

export default function Page() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<Tab>('open');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/support').then(r => r.ok ? r.json() : null).then(d => { if (d?.ok) setTickets(d.tickets || []); }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t => t.status === tab);
  const count = (s: Tab) => tickets.filter(t => t.status === s).length;

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Support</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>Tickets submitted from Help → Report a problem. First-response target: 24 hours.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {([['open', 'Open'], ['in-progress', 'In progress'], ['resolved', 'Resolved']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            background: tab === k ? 'var(--tx)' : 'var(--bg-2)',
            color: tab === k ? 'var(--bg)' : 'inherit',
            border: 0, cursor: 'pointer',
          }}>
            {label} · {count(k)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--tx-2)', padding: 24 }}>
          No {tab} tickets. Users submit them from Help → Report a problem.
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Ticket</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>From</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Subject</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Priority</th>
                <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Opened</th>
                <th style={{ padding: '11px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '.82em' }}>{t.id.slice(-8)}</td>
                  <td style={{ padding: '11px 14px' }}>@{t.user.handle}</td>
                  <td style={{ padding: '11px 14px' }}>{t.subject}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: '.76rem', fontWeight: 600,
                      background: t.priority === 'High' ? '#b3261e' : 'var(--bg-3)',
                      color: t.priority === 'High' ? '#fff' : 'inherit',
                    }}>{t.priority}</span>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--tx-2)', fontSize: '.85em' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => setSelected(t)} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load(); }} />}
    </>
  );
}

function TicketModal({ ticket, onClose, onDone }: { ticket: Ticket; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [reply, setReply] = useState(ticket.reply);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch(`/api/admin/support/${ticket.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority, reply, note: note || undefined }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Failed'); setBusy(false); return; }
      onDone();
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 620, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15em' }}>{ticket.subject}</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--tx-2)', fontSize: '.88em' }}>
          From @{ticket.user.handle} · {ticket.category} · {new Date(ticket.createdAt).toLocaleString()}
        </p>
        <div style={{ background: 'var(--bg-2)', borderRadius: 14, padding: 14, marginBottom: 14, whiteSpace: 'pre-wrap', fontSize: '.92em' }}>
          {ticket.body}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <label>
            <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Status</span>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label>
            <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Priority</span>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <option>Low</option>
              <option>Normal</option>
              <option>High</option>
            </select>
          </label>
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Reply to user (delivered as a notification)</span>
          <textarea value={reply} onChange={e => setReply(e.target.value.slice(0, 2000))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)', resize: 'vertical' }} />
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Internal note (not shown to user)</span>
          <input value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }} />
        </label>

        {ticket.notes.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 6 }}>Notes</span>
            {ticket.notes.map((n, i) => (
              <p key={i} style={{ margin: '4px 0', padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 8, fontSize: '.85em' }}>{n.t}</p>
            ))}
          </div>
        )}

        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
