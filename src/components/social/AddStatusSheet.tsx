'use client';
import { useState } from 'react';
import { useSheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export function AddStatusSheet({ onAdd }: { onAdd: (body: string, bg: number, img?: string) => void }) {
  const { closeSheet } = useSheet();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [bg, setBg] = useState(0);
  const [img, setImg] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(f.type)) { showToast('Unsupported file'); return; }
    if (f.size > 5e6) { showToast('Max 5 MB'); return; }
    const fd = new FormData(); fd.append('file', f);
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.ok) setImg(d.url);
      else showToast(d.error || 'Upload failed');
    } catch { showToast('Upload failed'); }
  }

  async function submit() {
    if (!text.trim() && !img) { showToast('Write something or add a photo'); return; }
    setBusy(true);
    await onAdd(text.trim(), bg, img);
    closeSheet();
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>New status</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: '.9em' }}>
        Disappears after 24 hours. Visible to your followers.
      </p>
      <textarea
        autoFocus value={text}
        onChange={(e) => setText(e.target.value.slice(0, 120))}
        placeholder="What's happening?"
        style={{ width: '100%', minHeight: 90, resize: 'none', border: '1.5px solid var(--b3)', borderRadius: 14, padding: 12, background: 'var(--bg)' }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {['Black', 'Grey', 'White'].map((label, i) => (
          <button
            key={label}
            onClick={() => setBg(i)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 12,
              border: bg === i ? '2px solid var(--tx)' : '1.5px solid var(--b3)',
              background: 'none', fontWeight: 600,
            }}
          >{label}</button>
        ))}
      </div>
      {img && (
        <div style={{ position: 'relative', marginTop: 12 }}>
          <img src={img} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12, filter: 'grayscale(1)' }} />
          <button onClick={() => setImg(undefined)} aria-label="Remove" style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: '50%', width: 28, height: 28 }}>×</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          Add photo
          <input type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
        </label>
        <span style={{ flex: 1 }} />
        <Button size="sm" onClick={submit} disabled={busy}>{busy ? 'Sharing…' : 'Share status'}</Button>
      </div>
    </div>
  );
}
