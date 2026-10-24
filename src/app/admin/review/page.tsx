'use client';
import { useEffect, useState } from 'react';

type QueuePost = {
  id: string; body: string; media: string; createdAt: string;
  author: { id: string; handle: string; displayName: string; suspended: boolean };
  reports: number; autoFlags: string[]; likes: number; comments: number;
};
type DonePost = {
  id: string; body: string; reviewedAt: string; decision: string;
  categories: string[]; author: { handle: string; displayName: string }; hidden: boolean;
};
type Strike = {
  id: string; points: number; category: string; reason: string;
  createdAt: string; handle: string; suspended: boolean;
};

const GL: [string, string, number][] = [
  ['spam', 'Spam & scams', 1],
  ['harass', 'Harassment & bullying', 2],
  ['hate', 'Hate speech', 3],
  ['threat', 'Violence & threats', 3],
  ['sexual', 'Sexual content', 3],
  ['selfharm', 'Self-harm', 2],
  ['misinfo', 'Misinformation', 1],
  ['imperson', 'Impersonation', 2],
  ['illegal', 'Illegal goods', 3],
  ['privacy', 'Private information', 2],
];

type Tab = 'queue' | 'done' | 'rules' | 'strikes';

export default function Page() {
  const [tab, setTab] = useState<Tab>('queue');
  const [queue, setQueue] = useState<QueuePost[]>([]);
  const [done, setDone] = useState<DonePost[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<QueuePost | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/admin/review').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.ok) { setQueue(d.queue || []); setDone(d.done || []); setStrikes(d.strikes || []); }
    }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const glName = (k: string) => GL.find(g => g[0] === k)?.[1] || k;

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Guideline review</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Review posts against community guidelines, issue strikes, and keep a record of every decision.
        Auto-flags are keyword hints only — a human decision is always required.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {([
          ['queue', 'Queue · ' + queue.length],
          ['done', 'Reviewed · ' + done.length],
          ['rules', 'Guidelines'],
          ['strikes', 'Strikes · ' + strikes.length],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            background: tab === k ? 'var(--tx)' : 'var(--bg-2)',
            color: tab === k ? 'var(--bg)' : 'inherit',
            border: 0, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}

      {!loading && tab === 'queue' && (
        queue.length === 0
          ? <p style={{ color: 'var(--tx-2)', padding: 24 }}>Queue is clear. Every live post has been reviewed.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queue.map(p => (
                <div key={p.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>@{p.author.handle}</b>
                      <p style={{ margin: '6px 0', fontSize: '.92em', whiteSpace: 'pre-wrap' }}>{p.body.slice(0, 200)}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {p.reports > 0 && (
                          <span style={{ fontSize: '.72rem', padding: '2px 8px', borderRadius: 8, background: '#b3261e', color: '#fff', fontWeight: 600 }}>
                            {p.reports} report{p.reports > 1 ? 's' : ''}
                          </span>
                        )}
                        {p.autoFlags.map(f => (
                          <span key={f} style={{ fontSize: '.72rem', padding: '2px 8px', borderRadius: 8, background: 'var(--bg-3)', fontWeight: 600 }}>
                            {glName(f)}
                          </span>
                        ))}
                        {p.autoFlags.length === 0 && p.reports === 0 && (
                          <span style={{ fontSize: '.8rem', color: 'var(--tx-2)' }}>No signals</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setModal(p)} style={{
                      padding: '8px 14px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)',
                      fontWeight: 600, fontSize: '.85rem', border: 0, cursor: 'pointer',
                    }}>Review</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {!loading && tab === 'done' && (
        done.length === 0
          ? <p style={{ color: 'var(--tx-2)', padding: 24 }}>Nothing reviewed yet.</p>
          : <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Post</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Decision</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Categories</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Author</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {done.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '11px 14px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.body.slice(0, 60)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 10, fontSize: '.76rem', fontWeight: 600,
                          background: p.decision === 'Approved' ? '#0a7a3d' : p.decision === 'Warned' ? 'var(--bg-3)' : '#b3261e',
                          color: p.decision === 'Warned' ? 'var(--tx)' : '#fff',
                        }}>{p.decision}</span>
                      </td>
                      <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{p.categories.map(glName).join(', ') || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>@{p.author.handle}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--tx-2)', fontSize: '.85rem' }}>{new Date(p.reviewedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {!loading && tab === 'rules' && (
        <>
          <div style={{ borderLeft: '3px solid var(--tx)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '0 12px 12px 0', marginBottom: 14, fontSize: '.9em' }}>
            <b>Strike points:</b> 3 points auto-suspends the account. Staff can lift strikes from the Strikes tab.
          </div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                  <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Guideline</th>
                  <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Points</th>
                  <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Default action</th>
                </tr>
              </thead>
              <tbody>
                {GL.map(([k, label, pts]) => (
                  <tr key={k} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600 }}>{label}</td>
                    <td style={{ padding: '11px 14px' }}>{pts}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{pts >= 3 ? 'Remove + strike' : pts === 2 ? 'Remove or warn' : 'Warn'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && tab === 'strikes' && (
        strikes.length === 0
          ? <p style={{ color: 'var(--tx-2)', padding: 24 }}>No strikes issued.</p>
          : <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Account</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Points</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Category</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Reason</th>
                    <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', color: 'var(--tx-2)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {strikes.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '11px 14px' }}>@{s.handle}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600 }}>{s.points}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{glName(s.category)}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{s.reason.slice(0, 60)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 10, fontSize: '.76rem', fontWeight: 600,
                          background: s.suspended ? '#b3261e' : '#0a7a3d', color: '#fff',
                        }}>{s.suspended ? 'Suspended' : 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {modal && <ReviewModal post={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </>
  );
}

function ReviewModal({ post, onClose, onDone }: { post: QueuePost; onClose: () => void; onDone: () => void }) {
  const [cats, setCats] = useState<string[]>(post.autoFlags);
  const [decision, setDecision] = useState('Approved');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function toggle(k: string) {
    setCats(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  }

  async function save() {
    setErr('');
    if (reason.trim().length < 5) { setErr('Add a rationale of at least 5 characters.'); return; }
    if (decision !== 'Approved' && cats.length === 0) { setErr('Select at least one guideline.'); return; }
    if (decision === 'Approved' && cats.length > 0) { setErr('Untick guidelines, or choose another decision.'); return; }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/review/${post.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, categories: cats, reason: reason.trim() }),
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
        background: 'var(--bg)', borderRadius: 24, padding: 24, maxWidth: 560, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.3em' }}>Review post #{post.id.slice(-6)}</h2>
        <p style={{ margin: '0 0 12px', color: 'var(--tx-2)', fontSize: '.9em' }}>by @{post.author.handle}</p>
        <div style={{ background: 'var(--bg-2)', borderRadius: 14, padding: 14, marginBottom: 14, whiteSpace: 'pre-wrap', fontSize: '.92em' }}>
          {post.body}
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: '.85em', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tx-2)' }}>Guidelines violated</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {GL.map(([k, label, pts]) => (
            <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={cats.includes(k)} onChange={() => toggle(k)} style={{ width: 'auto' }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ color: 'var(--tx-2)', fontSize: '.85em' }}>{pts} pt</span>
            </label>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Decision</span>
          <select value={decision} onChange={e => setDecision(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
            <option>Approved</option>
            <option>Warned</option>
            <option>Removed</option>
            <option>Removed + strike</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--tx-2)', marginBottom: 4 }}>Rationale (audit log)</span>
          <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, 300))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)', resize: 'vertical' }} />
        </label>

        {err && <p style={{ color: '#b3261e', fontWeight: 600, fontSize: '.9em', margin: '6px 0' }}>{err}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--bg-2)', border: 0, cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={save} disabled={busy} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontWeight: 600 }}>
            {busy ? 'Saving…' : 'Save decision'}
          </button>
        </div>
      </div>
    </div>
  );
}
