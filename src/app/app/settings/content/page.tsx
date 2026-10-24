'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { useUser } from '@/components/UserProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { useStatuses } from '@/lib/statuses';
import { useToast } from '@/components/ui/Toast';

type Post = { id: string; body: string; createdAt: string };

export default function Page() {
  const { user } = useUser();
  const statusesHook = useStatuses();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const myStatuses = statusesHook.mine?.items || [];

  useEffect(() => {
    if (!user) return;
    fetch(`/api/posts?author=${user.handle}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPosts(d.posts); })
      .finally(() => setLoading(false));
  }, [user]);

  async function deletePost(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const r = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (r.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast('Post deleted');
      } else {
        const d = await r.json().catch(() => ({}));
        showToast(d.error || 'Could not delete');
      }
    } catch { showToast('Network error'); }
  }

  return (
    <SettingsShell title="Your posts & status" back="/app/settings">
      <p className="muted">Everything you have shared. Delete removes for everyone and cannot be undone.</p>
      <h3>Posts · {posts.length}</h3>
      {loading && <p className="muted">Loading…</p>}
      {!loading && posts.length === 0 && <EmptyState icon="doc" title="No posts yet">Posts you publish will appear here.</EmptyState>}
      {posts.map((p) => (
        <div key={p.id} className="row" style={{ cursor: 'default' }}>
          <div className="row-body">
            <span className="row-title">{p.body.slice(0, 80) || 'Photo post'}</span>
            <span className="row-sub">{new Date(p.createdAt).toLocaleString()}</span>
          </div>
          <Link className="pill sm" href={`/app/posts/${p.id}`}>View</Link>
          <button className="pill sm" onClick={() => deletePost(p.id)}>Delete</button>
        </div>
      ))}
      <h3>Status · {myStatuses.length}</h3>
      {myStatuses.length === 0 && <p className="muted">No active status. Status updates you share appear here for 24 hours.</p>}
      {myStatuses.map((s) => (
        <div key={s.id} className="row" style={{ cursor: 'default' }}>
          <div className="row-body">
            <span className="row-title">{s.body || 'Photo status'}</span>
            <span className="row-sub">{new Date(s.createdAt).toLocaleString()} · {s.viewCount} {s.viewCount === 1 ? 'view' : 'views'}</span>
          </div>
        </div>
      ))}
    </SettingsShell>
  );
}
