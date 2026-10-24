'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useUser } from '@/components/UserProvider';
import { QuoteCard, QuotePost } from './QuoteCard';

const MAX_PHOTOS = 4;
const MAX_BYTES = 15 * 1024 * 1024;

export function ComposeSheet({
  quoteOfId,
  quotePost,
  onPosted,
}: {
  quoteOfId?: string;
  quotePost?: QuotePost;
  onPosted?: () => void;
}) {
  const { closeSheet } = useSheet();
  const { showToast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isQuote = !!quoteOfId;

  function done() {
    try { closeSheet(); } catch {}
    if (typeof window !== 'undefined' && window.location.pathname === '/app/posts/new') {
      router.push('/app');
    } else {
      router.refresh();
    }
    onPosted?.();
  }

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - mediaUrls.length;
    if (remaining <= 0) {
      showToast(`Max ${MAX_PHOTOS} photos`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const toUpload = files.slice(0, remaining);
    setUploading(toUpload.length);
    const results: string[] = [];
    for (const f of toUpload) {
      if (!/^image\/(png|jpe?g|gif|webp)$/.test(f.type)) { showToast(`${f.name}: unsupported`); continue; }
      if (f.size > MAX_BYTES) { showToast(`${f.name}: over 5 MB`); continue; }
      const fd = new FormData();
      fd.append('file', f);
      try {
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.ok) results.push(d.url);
        else showToast(`${f.name}: upload failed`);
      } catch { showToast(`${f.name}: network error`); }
    }
    setMediaUrls((prev) => [...prev, ...results].slice(0, MAX_PHOTOS));
    setUploading(0);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removePhoto(i: number) {
    setMediaUrls((prev) => prev.filter((_, j) => j !== i));
  }

  function setPollOption(i: number, v: string) {
    setPollOptions((prev) => prev.map((o, j) => (j === i ? v : o)));
  }
  function addPollOption() {
    if (pollOptions.length >= 4) return;
    setPollOptions((prev) => [...prev, '']);
  }
  function removePollOption(i: number) {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, j) => j !== i));
  }
  function disablePoll() {
    setPollEnabled(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  }

  async function publish() {
    if (isQuote && !text.trim()) {
      showToast('Add a comment to quote this post');
      return;
    }
    if (!isQuote && !text.trim() && mediaUrls.length === 0 && !pollEnabled) {
      showToast('Add something to publish');
      return;
    }
    if (pollEnabled) {
      if (!pollQuestion.trim()) { showToast('Enter a poll question'); return; }
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) { showToast('Add at least 2 poll options'); return; }
    }

    setBusy(true);
    try {
      if (isQuote) {
        const r = await fetch(`/api/posts/${quoteOfId}/repost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteText: text.trim() }),
        });
        const d = await r.json();
        if (!d.ok) { showToast(d.error || 'Failed'); setBusy(false); return; }
        showToast('Quote posted');
        done();
        return;
      }

      const payload: any = { body: text.trim() };
      if (mediaUrls.length) payload.mediaUrls = mediaUrls;
      if (mediaUrls.length) payload.media = mediaUrls[0];
      if (pollEnabled && pollQuestion.trim()) {
        payload.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.map((o) => o.trim()).filter(Boolean),
        };
      }

      const r = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!d.ok) { showToast(d.error || 'Failed'); setBusy(false); return; }
      showToast('Posted');
      done();
    } catch {
      showToast('Network error');
      setBusy(false);
    }
  }

  const quotePreview: QuotePost | null = quotePost
    ? {
        id: quotePost.id,
        body: quotePost.body,
        mediaUrls: quotePost.mediaUrls,
        createdAt: quotePost.createdAt,
        author: quotePost.author,
      }
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Avatar name={user?.displayName || 'You'} src={user?.avatar || undefined} />
        <div style={{ flex: 1 }}>
          <b style={{ display: 'block' }}>{user?.displayName || 'You'}</b>
          <small className="muted">@{user?.handle || 'you'}</small>
        </div>
        <span className="muted" style={{ fontSize: '.8em' }}>{text.length}/500</span>
      </div>

      {/* Textarea */}
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        placeholder={isQuote ? 'Add a comment…' : 'What would you like to share?'}
        style={{
          width: '100%',
          minHeight: isQuote ? 80 : 120,
          resize: 'none',
          border: 0,
          background: 'none',
          fontSize: '1.05em',
          outline: 0,
          color: 'inherit',
        }}
      />

      {/* Photo previews */}
      {mediaUrls.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mediaUrls.length === 1 ? '1fr' : '1fr 1fr',
            gap: 4,
            marginTop: 8,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {mediaUrls.map((u, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={u}
                alt=""
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: 'rgba(0,0,0,.65)',
                  color: '#fff',
                  border: 0,
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quote preview */}
      {isQuote && quotePreview && <QuoteCard post={quotePreview} />}

      {/* Poll editor */}
      {pollEnabled && (
        <div style={{ border: '1px solid var(--ln)', borderRadius: 14, padding: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <b style={{ fontSize: '.95em' }}>Poll</b>
            <button type="button" onClick={disablePoll} className="pill sm">Remove</button>
          </div>
          <label className="field" style={{ margin: '0 0 8px' }}>
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value.slice(0, 120))}
              placeholder="Ask a question…"
            />
          </label>
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <label className="field" style={{ flex: 1, margin: 0 }}>
                <input
                  value={opt}
                  onChange={(e) => setPollOption(i, e.target.value.slice(0, 80))}
                  placeholder={`Option ${i + 1}`}
                />
              </label>
              {pollOptions.length > 2 && (
                <button
                  type="button"
                  onClick={() => removePollOption(i)}
                  className="pill sm"
                  aria-label="Remove option"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 4 && (
            <button type="button" onClick={addPollOption} className="pill sm" style={{ marginTop: 4 }}>
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Bottom action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        {!isQuote && (
          <>
            <button
              type="button"
              className="ib"
              onClick={() => fileRef.current?.click()}
              aria-label="Add photo"
              disabled={mediaUrls.length >= MAX_PHOTOS || uploading > 0}
              style={{ border: '1px solid var(--ln)' }}
            >
              <Icon name="img" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={pickFiles}
              hidden
            />
            {!pollEnabled && (
              <button
                type="button"
                className="pill sm"
                onClick={() => setPollEnabled(true)}
              >
                Add poll
              </button>
            )}
            {uploading > 0 && (
              <small className="muted">Uploading {uploading}…</small>
            )}
            {mediaUrls.length > 0 && (
              <small className="muted">{mediaUrls.length}/{MAX_PHOTOS}</small>
            )}
          </>
        )}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="pill on"
          onClick={publish}
          disabled={busy}
        >
          {busy ? 'Posting…' : isQuote ? 'Quote' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
