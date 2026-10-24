'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

type Tab = 'posts' | 'comments' | 'status' | 'removed';

export default function Page() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('posts');
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/admin/content?type=${tab}&q=${encodeURIComponent(q)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.ok) setItems(d.items || []); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [tab, q]);

  async function del(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      const map: Record<Tab, string> = { posts: 'post', comments: 'comment', status: 'status', removed: '' };
      const r = await fetch(`/api/admin/content/${id}?type=${map[tab]}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Removed by admin' }),
      });
      const d = await r.json();
      if (d.ok) { showToast('Deleted'); load(); }
      else showToast(d.error || 'Failed');
    } catch { showToast('Network error'); }
  }

  async function restore(postId: string) {
    try {
      const r = await fetch('/api/admin/content/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const d = await r.json();
      if (d.ok) { showToast('Restored'); load(); }
      else showToast(d.error || 'Failed');
    } catch { showToast('Network error'); }
  }

  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Content</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>Moderate and restore published content.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['posts', 'comments', 'status', 'removed'] as Tab[]).map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 14px', borderRadius: 12, fontWeight: 600, fontSize: '.85rem',
            background: tab === k ? 'var(--tx)' : 'var(--bg-2)',
            color: tab === k ? 'var(--bg)' : 'inherit',
            border: 0, cursor: 'pointer', textTransform: 'capitalize',
          }}>{k}</button>
        ))}
      </div>

      {tab !== 'removed' && (
        <div style={{ marginBottom: 14 }}>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search content"
            style={{ width: '100%', maxWidth: 420, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--bg-2)' }} />
        </div>
      )}

      {loading && <p style={{ color: 'var(--tx-2)' }}>Loading…</p>}
      {!loading && items.length === 0 && <p style={{ color: 'var(--tx-2)', padding: 24 }}>No {tab} to show.</p>}

      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {tab === 'posts' && (
                    <>
                      <b>@{item.author.handle}</b>
                      <p style={{ margin: '6px 0 0', fontSize: '.92em' }}>{item.body.slice(0, 200)}{item.body.length > 200 ? '…' : ''}</p>
                      <p style={{ color: 'var(--tx-2)', fontSize: '.8em', marginTop: 4 }}>
                        {item.likeCount} likes · {item.commentCount} comments · {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                  {tab === 'comments' && (
                    <>
                      <b>@{item.author.handle}</b>
                      <p style={{ margin: '6px 0 0', fontSize: '.92em' }}>{item.body.slice(0, 200)}</p>
                      <Link href={`/app/posts/${item.post.id}`} style={{ color: 'var(--tx-2)', fontSize: '.8em', display: 'block', marginTop: 4 }}>
                        On: {item.post.body.slice(0, 80)}
                      </Link>
                    </>
                  )}
                  {tab === 'status' && (
                    <>
                      <b>@{item.user.handle}</b>
                      <p style={{ margin: '6px 0 0', fontSize: '.92em' }}>{item.body || '(photo status)'}</p>
                      <p style={{ color: 'var(--tx-2)', fontSize: '.8em', marginTop: 4 }}>
                        {item._count?.views ?? 0} views · expires {new Date(item.expiresAt).toLocaleString()}
                      </p>
                    </>
                  )}
                  {tab === 'removed' && (
                    <>
                      <b>@{item.author.handle}</b>
                      <p style={{ margin: '6px 0 0', fontSize: '.92em' }}>{item.body.slice(0, 200)}</p>
                      <p style={{ color: 'var(--tx-2)', fontSize: '.8em', marginTop: 4 }}>
                        Removed {new Date(item.hiddenAt).toLocaleString()} · decision: {item.reviewDecision || 'n/a'}
                      </p>
                    </>
                  )}
                </div>
                {tab === 'removed' ? (
                  <button onClick={() => restore(item.id)} style={{ padding: '6px 12px', borderRadius: 10, background: 'var(--tx)', color: 'var(--bg)', border: 0, cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>
                    Restore
                  </button>
                ) : (
                  <button onClick={() => del(item.id)} style={{ padding: '6px 12px', borderRadius: 10, background: '#b3261e', color: '#fff', border: 0, cursor: 'pointer', fontSize: '.82rem', fontWeight: 600 }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
