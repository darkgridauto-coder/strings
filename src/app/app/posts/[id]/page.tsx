'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostCard, FeedPost } from '@/components/social/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

type Author = { id: string; handle: string; displayName: string; avatar?: string | null };
type Comment = { id: string; body: string; createdAt: string; author: Author; parentId?: string | null };

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch(`/api/posts/${params.id}`).then(r => r.json()).then(d => {
      if (d.ok) { setPost(d.post); setComments(d.post.comments || []); }
    }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [params.id]);

  useEffect(() => {
    document.body.setAttribute('data-immersive', 'true');
    return () => document.body.removeAttribute('data-immersive');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/posts/${params.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text.trim(), parentId: replyingTo?.id || null }),
      });
      const d = await r.json();
      if (d.ok) {
        setText(''); setReplyingTo(null); load(); router.refresh();
      } else showToast(d.error || 'Failed to post comment');
    } catch { showToast('Network error'); }
    finally { setBusy(false); }
  }

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  function CommentNode({ c, depth = 0 }: { c: Comment; depth?: number }) {
    const replies = getReplies(c.id);
    const hasReplies = replies.length > 0;
    const timeAgo = (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(iso).toLocaleDateString();
    };

    return (
      <div style={{ position: 'relative', marginTop: depth === 0 ? 16 : 0 }}>
        <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
          <Link href={`/app/u/${c.author.handle}`} style={{ flexShrink: 0 }}>
            <Avatar name={c.author.displayName} src={c.author.avatar || undefined} size="sm" />
          </Link>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href={`/app/u/${c.author.handle}`} style={{ fontWeight: 700, fontSize: '.95em', color: 'var(--tx)' }}>
                {c.author.displayName}
              </Link>
              <span style={{ fontSize: '.8em', color: 'var(--t2)' }}>{timeAgo(c.createdAt)}</span>
            </div>
            <p style={{ margin: '4px 0 6px', fontSize: '.95em', lineHeight: 1.4 }}>{c.body}</p>
            <div style={{ display: 'flex', gap: 16, fontSize: '.8em', color: 'var(--t2)' }}>
              <button style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="heart" size={14} /> Like
              </button>
              <button onClick={() => setReplyingTo(c)} style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontWeight: 600 }}>
                Reply
              </button>
            </div>
          </div>
        </div>
        
        {/* Threading line */}
        {hasReplies && (
          <div style={{ 
            position: 'absolute', left: 16, top: 32, bottom: 0, 
            width: 2, background: 'var(--b3)', borderRadius: 1 
          }} />
        )}
        
        {/* Nested replies */}
        {hasReplies && (
          <div style={{ marginLeft: 44, borderLeft: '2px solid var(--b3)', paddingLeft: 12 }}>
            {replies.map(r => <CommentNode key={r.id} c={r} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <Link href="/app" className="ib" aria-label="Back"><Icon name="back" /></Link>
        <h1>Post</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        {loading && <p className="muted" style={{ textAlign: 'center' }}>Loading…</p>}
        {!loading && !post && <EmptyState icon="doc" title="Post not found">It may have been deleted.</EmptyState>}
        
        {post && (
          <>
            <PostCard post={post} full onChanged={load} />
            <h3 style={{ marginTop: 24, fontSize: '1.1em', borderBottom: '1px solid var(--ln)', paddingBottom: 8 }}>Comments</h3>
            
            {rootComments.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>No comments yet.</p>}
            
            <div style={{ paddingBottom: 80 }}>
              {rootComments.map(c => <CommentNode key={c.id} c={c} />)}
            </div>

            {/* Sticky Composer */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderTop: '1px solid var(--ln)', padding: '12px 16px', zIndex: 10 }}>
              {replyingTo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--b2)', padding: '6px 12px', borderRadius: 8, marginBottom: 8 }}>
                  <small className="muted">Replying to <b>@{replyingTo.author.handle}</b></small>
                  <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--tx)' }}><Icon name="x" size={14} /></button>
                </div>
              )}
              <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
                <label className="field" style={{ flex: 1, margin: 0 }}>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" />
                </label>
                <button type="submit" className="ib" disabled={busy} aria-label="Send" style={{ background: 'var(--tx)', color: 'var(--bg)' }}><Icon name="send" /></button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
