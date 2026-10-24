'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PostCard, FeedPost } from '@/components/social/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export default function Page({ params }: { params: { tag: string } }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          const needle = '#' + params.tag.toLowerCase();
          setPosts((d.posts as FeedPost[]).filter((p) => p.body.toLowerCase().includes(needle)));
        }
      })
      .finally(() => setLoading(false));
  }, [params.tag]);

  return (
    <>
      <header className="topbar">
        <Link href="/app/explore" className="ib" aria-label="Back"><Icon name="back" /></Link>
        <h1>Topic</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <h2 style={{ marginTop: 8 }}>#{params.tag}</h2>
        <p className="muted">Posts about this topic.</p>
        {loading && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Loading…</p>}
        {!loading && posts.length === 0 && <EmptyState icon="search" title={`No posts for #${params.tag} yet`}>Nothing has been posted with this topic.</EmptyState>}
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}
