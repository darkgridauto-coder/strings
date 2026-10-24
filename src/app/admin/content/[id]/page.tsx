'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

type Post = {
  id: string;
  body: string;
  media: string;
  createdAt: string;
  hiddenAt: string | null;
  reviewDecision: string;
  reviewCats: string;
  author: { handle: string; displayName: string };
  likeCount?: number;
  commentCount?: number;
};

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  function load() {
    setLoading(true);
    fetch(`/api/posts/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.ok) setPost(d.post);
        else setErr(d?.error || 'Post not found');
      })
      .catch(() => setErr('Network error'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [params.id]);

  async function remove() {
    if (!confirm('Remove this post from the app feed?')) return;
    try {
      const r = await fetch(`/api/admin/content/${params.id}?type=post`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Removed by admin' }),
      });
      const d = await r.json();
      if (d.ok) { showToast('Removed'); router.push('/admin/content'); }
      else showToast(d.error || 'Failed');
    } catch { showToast('Network error'); }
  }

  async function restore() {
    try {
      const r = await fetch('/api/admin/content/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: params.id }),
      });
      const d = await r.json();
      if (d.ok) { showToast('Restored'); router.push('/admin/content'); }
      else showToast(d.error || 'Failed');
    } catch { showToast('Network error'); }
  }

  return (
    <>
      <Link href="/admin/content" style={{ color: 'var(--tx-2)', fontSize: '.9em' }}>
        ← Back to content
      </Link>

      {loading && <p style={{ color: 'var(--tx-2)', marginTop: 12 }}>Loading…</p>}
      {err && <p style={{ color: 'var(--tx-2)', marginTop: 12 }}>{err}</p>}

      {post && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <b>Post #{post.id.slice(-6)}</b>
              <div style={{ color: 'var(--tx-2)', fontSize: '.85em' }}>
                by @{post.author.handle} · {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>
            {post.hiddenAt && (
              <span style={{
                padding: '3px 10px', borderRadius: 10,
                background: '#b3261e', color: '#fff',
                fontSize: '.78rem', fontWeight: 600,
              }}>Removed</span>
            )}
          </div>

          <div style={{ background: 'var(--bg-2)', borderRadius: 14, padding: 14, marginBottom: 14, whiteSpace: 'pre-wrap' }}>
            {post.body || '(no text)'}
          </div>

          {post.media && (
            <img
              src={post.media}
              alt=""
              style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, marginBottom: 14, display: 'block' }}
            />
          )}

          {post.reviewDecision && (
            <div style={{ marginBottom: 14, fontSize: '.9em', color: 'var(--tx-2)' }}>
              <b>Last decision:</b> {post.reviewDecision}
              {post.reviewCats && post.reviewCats !== '[]' && ` · ${post.reviewCats}`}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href={`/app/posts/${post.id}`}
              style={{
                padding: '10px 18px', borderRadius: 12,
                background: 'var(--bg-2)', border: 0, cursor: 'pointer',
                fontWeight: 600, textDecoration: 'none', color: 'inherit', fontSize: '.9rem',
              }}
            >
              View in app
            </Link>
            {post.hiddenAt ? (
              <button
                onClick={restore}
                style={{
                  padding: '10px 18px', borderRadius: 12,
                  background: '#0a7a3d', color: '#fff',
                  border: 0, cursor: 'pointer', fontWeight: 600, fontSize: '.9rem',
                }}
              >
                Restore
              </button>
            ) : (
              <button
                onClick={remove}
                style={{
                  padding: '10px 18px', borderRadius: 12,
                  background: '#b3261e', color: '#fff',
                  border: 0, cursor: 'pointer', fontWeight: 600, fontSize: '.9rem',
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
