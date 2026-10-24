'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { Icon } from '@/components/ui/Icon';

const CATEGORIES = ['Sign-in', 'Messaging', 'Posts & media', 'Privacy & safety', 'Something else'];

type Att = { url: string; name: string; mimeType: string; size: number };

export default function Page() {
  const { showToast } = useToast();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Att[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (attachments.length >= 3) { showToast('Max 3 attachments'); break; }
      if (f.size > 5_000_000) { showToast(`${f.name}: max 5 MB`); continue; }
      if (!/^(image\/(png|jpe?g|gif|webp)|application\/pdf|text\/plain)$/.test(f.type)) {
        showToast(`${f.name}: unsupported type`); continue;
      }
      const fd = new FormData(); fd.append('file', f);
      try {
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.ok) setAttachments((prev) => [...prev, { url: d.url, name: f.name, mimeType: f.type, size: f.size }]);
        else showToast(`${f.name}: upload failed`);
      } catch { showToast(`${f.name}: upload failed`); }
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeAtt(i: number) {
    setAttachments((prev) => prev.filter((_, j) => j !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!category) return setErr('Choose a category.');
    if (description.trim().length < 10) return setErr('Describe the problem in at least 10 characters.');
    setBusy(true);
    try {
      const r = await fetch('/api/reports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'support',
          targetId: 'app',
          reason: `[${category}] ${description.trim()}`,
          attachments,
        }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Submission failed'); setBusy(false); return; }
      setDone(true);
      showToast('Report submitted');
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <>
      <header className="topbar">
        <Link href="/app/help" className="ib" aria-label="Back">←</Link>
        <h1>Report a problem</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        {done ? (
          <div className="card">
            <b>Report received</b>
            <p className="muted" style={{ marginTop: 8 }}>The support team will follow up. Reports are stored securely and reviewed by authorised staff.</p>
            <Link href="/app/help" className="btn o" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 12 }}>Back to help</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="muted">Tell us what went wrong so the support team can investigate.</p>
            <label className="field">
              <span className="field-label">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Choose a category</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 1000))} placeholder="What happened? What did you expect? How can we reproduce it?" />
            </label>

            <div className="field" style={{ cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <span className="field-label">Attachments (optional · max 3 · 5 MB each)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', color: 'var(--t2)' }}>
                <Icon name="img" size={18} />
                <span>Attach a screenshot or file</span>
              </div>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,text/plain" onChange={pickFiles} hidden />

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {attachments.map((a, i) => (
                  <div key={i} className="chip">
                    {a.mimeType.startsWith('image/') ? (
                      <img src={a.url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, filter: 'grayscale(1)' }} />
                    ) : (
                      <Icon name="doc" size={18} />
                    )}
                    <span style={{ fontSize: '.82em' }}>{a.name.slice(0, 24)}</span>
                    <button type="button" onClick={() => removeAtt(i)} aria-label="Remove">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="card" style={{ background: 'transparent' }}>
              <b>Privacy reminder</b>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '.9em' }}>
                Don&apos;t include passwords, private keys, or unnecessary personal information.
              </p>
            </div>
            {err && <p style={{ fontWeight: 600, color: 'var(--tx)' }}>{err}</p>}
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit report'}</button>
          </form>
        )}
      </div>
    </>
  );
}
