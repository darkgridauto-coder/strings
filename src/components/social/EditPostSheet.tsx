'use client';
import { useState } from 'react';
import { useSheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';

export function EditPostSheet({
  postId,
  initialBody,
  onSaved,
}: {
  postId: string;
  initialBody: string;
  onSaved: () => void;
}) {
  const { closeSheet } = useSheet();
  const { showToast } = useToast();
  const [body, setBody] = useState(initialBody);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!body.trim()) {
      showToast('Body cannot be empty');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const d = await r.json();
      if (d.ok) {
        closeSheet();
        showToast('Post updated');
        onSaved();
      } else {
        showToast(d.error || 'Could not save');
      }
    } catch {
      showToast('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Edit post</h3>
      <label className="field">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          style={{ minHeight: 120 }}
          autoFocus
        />
      </label>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <small className="muted">{body.length}/500</small>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pill" onClick={closeSheet}>Cancel</button>
          <button type="button" className="pill on" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
