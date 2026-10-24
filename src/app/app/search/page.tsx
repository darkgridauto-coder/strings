'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PostCard, FeedPost } from '@/components/social/PostCard';

type SearchUser = { id: string; handle: string; displayName: string; bio: string; isPrivate: boolean };

export default function Page({ searchParams }: { searchParams: { q?: string } }) {
  const [q, setQ] = useState(searchParams.q ?? '');
  const [tab, setTab] = useState<'all' | 'people' | 'post'>('all');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setUsers([]); setPosts([]); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setUsers(d.users || []);
          setPosts((d.posts || []).map((p: any) => ({
            id: p.id, body: p.body, media: p.media, createdAt: p.createdAt,
            author: { ...p.author, id: p.author.handle },
            likeCount: 0, commentCount: 0, likedByMe: false, savedByMe: false,
          })));
        }
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <header className="topbar">
        <Link href="/app/explore" className="ib" aria-label="Back"><Icon name="back" /></Link>
        <h1>Search</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <label className="field" style={{ marginTop: 0 }}>
          <span className="field-label">Search</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Strings" autoFocus />
        </label>
        <div className="seg">
          <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All</button>
          <button className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>People</button>
          <button className={tab === 'post' ? 'on' : ''} onClick={() => setTab('post')}>Posts</button>
        </div>
        {!q.trim() && <EmptyState icon="search" title="Search Strings">Find people, posts and topics.</EmptyState>}
        {loading && <p className="muted" style={{ textAlign: 'center', padding: 24 }}>Searching…</p>}
        {!loading && q.trim() && (
          <>
            {(tab === 'all' || tab === 'people') && users.length > 0 && (
              <>
                <h3>People</h3>
                {users.map((u) => (
                  <Link key={u.id} href={`/app/u/${u.handle}`} className="row">
                    <Avatar name={u.displayName} />
                    <div className="row-body">
                      <span className="row-title">{u.displayName}</span>
                      <span className="row-sub">@{u.handle}{u.isPrivate ? ' · Private' : ''}</span>
                    </div>
                    <Icon name="chevron" size={16} />
                  </Link>
                ))}
              </>
            )}
            {(tab === 'all' || tab === 'post') && posts.length > 0 && (
              <>
                <h3>Posts</h3>
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </>
            )}
            {users.length === 0 && posts.length === 0 && (
              <EmptyState icon="search" title={`No results for "${q}"`}>Try a different word or check the spelling.</EmptyState>
            )}
          </>
        )}
      </div>
    </>
  );
}
