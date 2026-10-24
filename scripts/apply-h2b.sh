#!/usr/bin/env bash
set -euo pipefail
cd ~/strings-app

write() { local path="$1"; mkdir -p "$(dirname "$path")"; cat > "$path"; }

# ---------- 1. Add repeat icon to Icon.tsx ----------
node << 'ICON_PATCH'
const fs = require('fs');
const p = 'src/components/ui/Icon.tsx';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('repeat:')) {
  s = s.replace(
    /(\s*play:)/,
    "\n  repeat: 'M17 2l4 4-4 4M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 01-4 4H3',\n$1"
  );
  fs.writeFileSync(p, s);
  console.log('✔ Icon.tsx: repeat icon added');
} else console.log('✔ Icon.tsx already has repeat');
ICON_PATCH

# ---------- 2. MediaCarousel ----------
write src/components/social/MediaCarousel.tsx << 'FILE_END'
'use client';
import { openImage } from '@/components/ui/ImageViewer';

export function MediaCarousel({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null;
  const list = urls.slice(0, 4);
  const n = list.length;

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'zoom-in',
    display: 'block',
  };

  if (n === 1) {
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', marginTop: 8 }}>
        <img
          src={list[0]}
          alt=""
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImage(list[0]); }}
          style={{ ...imgStyle, maxHeight: 420, height: 'auto', aspectRatio: '16/10' }}
        />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          borderRadius: 20,
          overflow: 'hidden',
          marginTop: 8,
          aspectRatio: '2/1',
        }}
      >
        {list.map((u, i) => (
          <img
            key={i}
            src={u}
            alt=""
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImage(u); }}
            style={imgStyle}
          />
        ))}
      </div>
    );
  }

  if (n === 3) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 4,
          borderRadius: 20,
          overflow: 'hidden',
          marginTop: 8,
          aspectRatio: '16/9',
        }}
      >
        <img
          src={list[0]}
          alt=""
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImage(list[0]); }}
          style={{ ...imgStyle, gridRow: 'span 2' }}
        />
        <img
          src={list[1]}
          alt=""
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImage(list[1]); }}
          style={imgStyle}
        />
        <img
          src={list[2]}
          alt=""
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImage(list[2]); }}
          style={imgStyle}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 4,
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 8,
        aspectRatio: '1',
      }}
    >
      {list.map((u, i) => (
        <img
          key={i}
          src={u}
          alt=""
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openImage(u); }}
          style={imgStyle}
        />
      ))}
    </div>
  );
}
FILE_END

# ---------- 3. QuoteCard ----------
write src/components/social/QuoteCard.tsx << 'FILE_END'
'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedSeal } from '@/components/ui/VerifiedSeal';

export type QuotePost = {
  id: string;
  body: string;
  mediaUrls?: string[];
  createdAt: string;
  author: {
    handle: string;
    displayName: string;
    avatar?: string | null;
    verifiedTier?: string;
  };
};

export function QuoteCard({ post }: { post: QuotePost }) {
  const preview = post.body.length > 200 ? post.body.slice(0, 200) + '…' : post.body;
  const firstImage = post.mediaUrls && post.mediaUrls[0];

  return (
    <Link
      href={`/app/posts/${post.id}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'block',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 12,
        marginTop: 10,
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <Avatar name={post.author.displayName} src={post.author.avatar || undefined} size="sm" />
        <div style={{ minWidth: 0 }}>
          <b style={{ display: 'inline-flex', alignItems: 'center', fontSize: '.9em' }}>
            {post.author.displayName}
            {post.author.verifiedTier ? <VerifiedSeal tier={post.author.verifiedTier} size={14} /> : null}
          </b>
          <small className="muted" style={{ fontSize: '.78em', display: 'block' }}>
            @{post.author.handle} · {new Date(post.createdAt).toLocaleDateString()}
          </small>
        </div>
      </div>
      {preview && <p style={{ margin: 0, fontSize: '.92em', lineHeight: 1.5 }}>{preview}</p>}
      {firstImage && (
        <img
          src={firstImage}
          alt=""
          style={{
            width: '100%',
            maxHeight: 160,
            objectFit: 'cover',
            borderRadius: 10,
            marginTop: 8,
            display: 'block',
          }}
        />
      )}
    </Link>
  );
}
FILE_END

# ---------- 4. PollCard ----------
write src/components/social/PollCard.tsx << 'FILE_END'
'use client';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export type Poll = {
  id: string;
  question: string;
  closesAt: string | null;
  options: { id: string; text: string; votes: number }[];
  votedOptionId: string | null;
};

export function PollCard({ poll, onVoted }: { poll: Poll; onVoted?: () => void }) {
  const { showToast } = useToast();
  const [data, setData] = useState<Poll>(poll);
  const [busy, setBusy] = useState(false);

  const closed = data.closesAt ? new Date(data.closesAt).getTime() < Date.now() : false;
  const total = data.options.reduce((n, o) => n + o.votes, 0);
  const voted = !!data.votedOptionId;

  async function vote(optionId: string) {
    if (busy || voted || closed) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/polls/${data.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const d = await r.json();
      if (d.ok) {
        setData({ ...data, ...d.poll });
        onVoted?.();
      } else {
        showToast(d.error || 'Could not vote');
      }
    } catch {
      showToast('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 14,
        marginTop: 10,
      }}
    >
      <b style={{ display: 'block', marginBottom: 10, fontSize: '.95em' }}>{data.question}</b>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.options.map((o) => {
          const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
          const mine = data.votedOptionId === o.id;
          const disabled = voted || closed || busy;
          return (
            <button
              key={o.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                vote(o.id);
              }}
              disabled={disabled}
              style={{
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 12,
                border: mine ? '1.5px solid var(--tx)' : '1px solid var(--line)',
                background: 'var(--bg)',
                cursor: disabled ? 'default' : 'pointer',
                color: 'inherit',
              }}
            >
              {voted && pct > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: pct + '%',
                    background: mine ? 'var(--b2)' : 'var(--bg-2)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: '.92em',
                }}
              >
                <span style={{ fontWeight: mine ? 650 : 500 }}>{o.text}</span>
                {voted && <span className="muted">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="muted" style={{ fontSize: '.78em', marginTop: 8 }}>
        {total} vote{total === 1 ? '' : 's'}
        {closed
          ? ' · Closed'
          : data.closesAt
            ? ` · Closes ${new Date(data.closesAt).toLocaleDateString()}`
            : ''}
      </div>
    </div>
  );
}
FILE_END

# ---------- 5. EditPostSheet ----------
write src/components/social/EditPostSheet.tsx << 'FILE_END'
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
FILE_END

# ---------- 6. ComposeSheet (multi-photo, quote, poll) ----------
write src/components/social/ComposeSheet.tsx << 'FILE_END'
'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useUser } from '@/components/UserProvider';
import { QuoteCard, QuotePost } from './QuoteCard';

type ComposeQuote = {
  id: string;
  body: string;
  mediaUrls?: string[];
  createdAt: string;
  author: { handle: string; displayName: string; avatar?: string | null; verifiedTier?: string };
};

export function ComposeSheet({ quoteOfId, quotePost }: { quoteOfId?: string; quotePost?: ComposeQuote }) {
  const { closeSheet } = useSheet();
  const { showToast } = useToast();
  const router = useRouter();
  const { user } = useUser();

  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isQuote = !!quoteOfId;

  async function uploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 4 - mediaUrls.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) {
      showToast('Maximum 4 photos');
      return;
    }
    setUploading(toUpload.length);
    const results: string[] = [];
    for (const f of toUpload) {
      if (!/^image\/(png|jpe?g|gif|webp)$/.test(f.type)) {
        showToast(`${f.name}: unsupported type`);
        continue;
      }
      if (f.size > 5_000_000) {
        showToast(`${f.name}: over 5 MB`);
        continue;
      }
      const fd = new FormData();
      fd.append('file', f);
      try {
        const r = await fetch('/api/upload', { method: 'POST', body: fd });
        const d = await r.json();
        if (d.ok) results.push(d.url);
        else showToast(`${f.name}: upload failed`);
      } catch {
        showToast(`${f.name}: upload failed`);
      }
    }
    setMediaUrls((prev) => [...prev, ...results].slice(0, 4));
    setUploading(0);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(i: number) {
    setMediaUrls((prev) => prev.filter((_, j) => j !== i));
  }

  function setPollOption(i: number, v: string) {
    setPollOptions((prev) => prev.map((o, j) => (i === j ? v : o)));
  }

  function addPollOption() {
    if (pollOptions.length >= 4) return;
    setPollOptions((prev) => [...prev, '']);
  }

  function removePollOption(i: number) {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, j) => j !== i));
  }

  async function publish() {
    if (isQuote) {
      if (!text.trim()) {
        showToast('Add your comment to quote this post');
        return;
      }
    } else if (!text.trim() && mediaUrls.length === 0 && !pollOpen) {
      showToast('Write something, add a photo, or add a poll');
      return;
    }

    if (pollOpen) {
      if (!pollQuestion.trim()) {
        showToast('Enter a poll question');
        return;
      }
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        showToast('Add at least 2 poll options');
        return;
      }
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
        if (!d.ok) {
          showToast(d.error || 'Could not quote');
          setBusy(false);
          return;
        }
        closeSheet();
        showToast('Quote posted');
        if (window.location.pathname === '/app') window.location.reload();
        else router.refresh();
        return;
      }

      const payload: any = {
        body: text.trim(),
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        media: mediaUrls[0] || '',
      };
      if (pollOpen) {
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
      if (!d.ok) {
        showToast(d.error || 'Publish failed');
        setBusy(false);
        return;
      }
      closeSheet();
      showToast('Posted');
      if (window.location.pathname === '/app') window.location.reload();
      else router.refresh();
    } catch {
      showToast('Network error');
      setBusy(false);
    }
  }

  const quotePreview: QuotePost | null = quotePost
    ? {
        id: quotePost.id,
        body: quotePost.body,
        mediaUrls: quotePost.mediaUrls || [],
        createdAt: quotePost.createdAt,
        author: quotePost.author,
      }
    : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Avatar name={user?.displayName || 'You'} src={user?.avatar || undefined} />
        <div style={{ flex: 1 }}>
          <b style={{ display: 'block' }}>{user?.displayName || 'You'}</b>
          <small className="muted">@{user?.handle || 'you'} · Everyone</small>
        </div>
        <span className="muted" style={{ fontSize: '.8em' }}>{text.length}/500</span>
      </div>

      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        placeholder={isQuote ? 'Add a comment…' : 'What would you like to share?'}
        style={{
          width: '100%',
          minHeight: isQuote ? 90 : 130,
          resize: 'none',
          border: 0,
          background: 'none',
          fontSize: '1.05em',
          outline: 0,
        }}
      />

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
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Remove image"
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
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {isQuote && quotePreview && <QuoteCard post={quotePreview} />}

      {!isQuote && pollOpen && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <b style={{ fontSize: '.95em' }}>Poll</b>
            <button
              type="button"
              onClick={() => setPollOpen(false)}
              className="pill sm"
            >
              Remove
            </button>
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
            <button
              type="button"
              onClick={addPollOption}
              className="pill sm"
              style={{ marginTop: 4 }}
            >
              + Add option
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        {!isQuote && (
          <>
            <button
              type="button"
              className="ib"
              onClick={() => fileRef.current?.click()}
              aria-label="Add image"
              disabled={mediaUrls.length >= 4 || uploading > 0}
              style={{ border: '1px solid var(--ln)' }}
            >
              <Icon name="img" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={uploadFiles}
              hidden
            />
            {!pollOpen && (
              <button
                type="button"
                className="pill sm"
                onClick={() => setPollOpen(true)}
              >
                Add poll
              </button>
            )}
            {uploading > 0 && <small className="muted">Uploading {uploading}…</small>}
            {mediaUrls.length > 0 && (
              <small className="muted">{mediaUrls.length}/4</small>
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
FILE_END

# ---------- 7. PostCard (rewrite with new components) ----------
write src/components/social/PostCard.tsx << 'FILE_END'
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Row } from '@/components/ui/Row';
import { useToast } from '@/components/ui/Toast';
import { useSheet } from '@/components/ui/Sheet';
import { useUser } from '@/components/UserProvider';
import { VerifiedSeal } from '@/components/ui/VerifiedSeal';
import { MediaCarousel } from './MediaCarousel';
import { QuoteCard } from './QuoteCard';
import { PollCard, type Poll } from './PollCard';
import { EditPostSheet } from './EditPostSheet';
import { ComposeSheet } from './ComposeSheet';

export type FeedPost = {
  id: string;
  body: string;
  media: string;
  mediaUrls?: string[];
  createdAt: string;
  editedAt?: string | null;
  author: { id: string; handle: string; displayName: string; avatar?: string | null; verifiedTier?: string };
  likeCount: number;
  commentCount: number;
  repostCount?: number;
  likedByMe: boolean;
  savedByMe: boolean;
  quoteText?: string;
  repostOf?: {
    id: string;
    body: string;
    media: string;
    mediaUrls?: string[];
    createdAt: string;
    author: { handle: string; displayName: string; avatar?: string | null; verifiedTier?: string };
    likeCount: number;
    commentCount: number;
  } | null;
  poll?: Poll | null;
};

export function PostCard({ post, full = false, onChanged }: { post: FeedPost; full?: boolean; onChanged?: () => void }) {
  const { showToast } = useToast();
  const { openSheet, closeSheet } = useSheet();
  const { user } = useUser();
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [saved, setSaved] = useState(post.savedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);

  const isAuthor = user?.id === post.author.id;
  const isRepost = !!(post.repostOf && !post.quoteText);
  const isQuote = !!(post.repostOf && post.quoteText);

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const r = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!r.ok) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
        showToast('Could not like');
      } else {
        onChanged?.();
      }
    } catch {
      setLiked(!next);
      showToast('Network error');
    }
  }

  async function toggleSave(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const next = !saved;
    setSaved(next);
    try {
      const r = await fetch(`/api/posts/${post.id}/save`, { method: 'POST' });
      if (!r.ok) {
        setSaved(!next);
        showToast('Could not save');
      } else {
        showToast(next ? 'Saved' : 'Removed from saved');
        onChanged?.();
      }
    } catch {
      setSaved(!next);
      showToast('Network error');
    }
  }

  async function repost() {
    const targetId = post.repostOf?.id || post.id;
    try {
      const r = await fetch(`/api/posts/${targetId}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (d.ok) {
        setRepostCount((c) => c + 1);
        showToast('Reposted');
        onChanged?.();
      } else {
        showToast(d.error || 'Could not repost');
      }
    } catch {
      showToast('Network error');
    }
  }

  function openQuote() {
    const target = post.repostOf || post;
    openSheet(
      <ComposeSheet
        quoteOfId={target.id}
        quotePost={{
          id: target.id,
          body: target.body,
          mediaUrls: target.mediaUrls,
          createdAt: target.createdAt,
          author: target.author,
        }}
      />
    );
  }

  function share(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      navigator.clipboard.writeText(`${window.location.origin}/app/posts/${post.id}`);
      showToast('Link copied');
    } catch {
      showToast('Could not copy');
    }
  }

  async function deletePost() {
    closeSheet();
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const r = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (r.ok) {
        showToast('Post deleted');
        onChanged?.();
        if (full) router.push('/app');
      } else {
        const d = await r.json().catch(() => ({}));
        showToast(d.error || 'Could not delete');
      }
    } catch {
      showToast('Network error');
    }
  }

  function openEdit() {
    closeSheet();
    openSheet(
      <EditPostSheet
        postId={post.id}
        initialBody={post.body}
        onSaved={() => onChanged?.()}
      />
    );
  }

  function openMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const canEdit = isAuthor && !post.poll && !post.repostOf;
    const canQuote = !post.repostOf;
    openSheet(
      <div>
        <h3 style={{ marginTop: 0 }}>Post options</h3>
        <Row
          icon="share"
          title="Copy link"
          sub="Copy a link to this post"
          onClick={() => {
            closeSheet();
            try {
              navigator.clipboard.writeText(`${window.location.origin}/app/posts/${post.id}`);
              showToast('Link copied');
            } catch {
              showToast('Could not copy');
            }
          }}
        />
        {canQuote && (
          <Row
            icon="repeat"
            title="Quote post"
            sub="Share this with your own comment"
            onClick={() => { closeSheet(); openQuote(); }}
          />
        )}
        {canEdit && (
          <Row
            icon="edit"
            title="Edit post"
            sub="Edit the body · shows an edited mark"
            onClick={openEdit}
          />
        )}
        {isAuthor ? (
          <Row
            icon="x"
            title="Delete post"
            sub="Removes it for everyone · cannot be undone"
            onClick={deletePost}
          />
        ) : (
          <Row
            icon="info"
            title="Report post"
            sub="Flag this for moderation"
            onClick={() => { closeSheet(); showToast('Use Help → Report a problem to flag content'); }}
          />
        )}
      </div>
    );
  }

  function bodyHtml(text: string) {
    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#') && word.length > 1) {
        const tag = word.slice(1);
        return (
          <Link
            key={i}
            href={`/app/tags/${tag}`}
            style={{ fontWeight: 650, textDecoration: 'underline' }}
            onClick={(e) => e.stopPropagation()}
          >
            {word}
          </Link>
        );
      }
      return <span key={i}>{word}</span>;
    });
  }

  function renderHeader(author: FeedPost['author'], createdAt: string, editedAt?: string | null, showMenu = true) {
    return (
      <div className="ph">
        <Link href={`/app/u/${author.handle}`}>
          <Avatar name={author.displayName} src={author.avatar || undefined} />
        </Link>
        <div className="m">
          <Link href={`/app/u/${author.handle}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <b>{author.displayName}</b>
            {author.verifiedTier ? <VerifiedSeal tier={author.verifiedTier} size={16} /> : null}
          </Link>
          <small style={{ color: 'var(--t2)' }}>
            @{author.handle} · {new Date(createdAt).toLocaleDateString()}
            {editedAt ? <span className="muted"> · edited</span> : null}
          </small>
        </div>
        {showMenu && (
          <button className="ib" aria-label="More" onClick={openMenu}>
            <Icon name="more" />
          </button>
        )}
      </div>
    );
  }

  return (
    <article className={`post${full ? ' full' : ''}`}>
      {isRepost && post.repostOf && (
        <>
          <div
            style={{
              fontSize: '.82em',
              color: 'var(--t2)',
              marginBottom: 6,
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <Icon name="repeat" size={14} />
            <Link href={`/app/u/${post.author.handle}`}>
              <b>{post.author.displayName}</b>
            </Link>{' '}
            reposted
          </div>
          {renderHeader(post.repostOf.author, post.repostOf.createdAt, null, false)}
          <Link href={`/app/posts/${post.repostOf.id}`}>
            {post.repostOf.body && <div className="pt">{bodyHtml(post.repostOf.body)}</div>}
            {post.repostOf.mediaUrls && post.repostOf.mediaUrls.length > 0 && (
              <MediaCarousel urls={post.repostOf.mediaUrls} />
            )}
          </Link>
        </>
      )}

      {!isRepost && (
        <>
          {renderHeader(post.author, post.createdAt, post.editedAt)}
          <Link href={`/app/posts/${post.id}`}>
            {post.body && <div className="pt">{bodyHtml(post.body)}</div>}
            {(post.mediaUrls?.length || 0) > 0 || (post.media && !isQuote) ? (
              <MediaCarousel urls={post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : [post.media]} />
            ) : null}
          </Link>
          {isQuote && post.repostOf && (
            <>
              {post.quoteText && (
                <div style={{ margin: '8px 0 0', fontSize: '.98em', lineHeight: 1.5 }}>
                  {bodyHtml(post.quoteText)}
                </div>
              )}
              <QuoteCard
                post={{
                  id: post.repostOf.id,
                  body: post.repostOf.body,
                  mediaUrls: post.repostOf.mediaUrls,
                  createdAt: post.repostOf.createdAt,
                  author: post.repostOf.author,
                }}
              />
            </>
          )}
          {post.poll && <PollCard poll={post.poll} onVoted={onChanged} />}
        </>
      )}

      <div className="acts">
        <button className={liked ? 'on' : ''} onClick={toggleLike} aria-label="Like">
          <Icon name="heart" size={18} />
          {likeCount}
        </button>
        <Link
          href={`/app/posts/${post.id}`}
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            minHeight: 44,
            padding: '6px 10px',
            borderRadius: 10,
          }}
        >
          <Icon name="chat" size={18} />
          {post.commentCount}
        </Link>
        <button onClick={repost} aria-label="Repost">
          <Icon name="repeat" size={18} />
          {repostCount > 0 ? repostCount : ''}
        </button>
        <button onClick={share} aria-label="Share">
          <Icon name="share" size={18} />
        </button>
        <span style={{ flex: 1 }} />
        <button className={saved ? 'on' : ''} onClick={toggleSave} aria-label="Save">
          <Icon name="save" size={18} />
        </button>
      </div>
    </article>
  );
}
FILE_END

echo ""
echo "=================================================="
echo " H2b written — 6 UI files + Icon patch"
echo "=================================================="
