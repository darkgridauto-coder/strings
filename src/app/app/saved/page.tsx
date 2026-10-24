'use client';
import { useEffect, useState } from 'react';
import { PostCard, FeedPost } from '@/components/social/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Page() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch('/api/saved')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPosts(d.posts); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <header className="topbar"><span style={{ width: 42 }} /><h1 className="left">Saved posts</h1><div className="topbar-actions" /></header>
      <div className="page">
        <p className="muted">Posts you saved for your own reference. Only you can see this.</p>
        {loading && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</p>}
        {!loading && posts.length === 0 && (
          <EmptyState icon="save" title="Nothing saved yet">Tap the bookmark on any post to keep it here.</EmptyState>
        )}
        {posts.map((p) => <PostCard key={p.id} post={p} onChanged={load} />)}
      </div>
    </>
  );
}
