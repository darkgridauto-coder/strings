'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PostCard, FeedPost } from '@/components/social/PostCard';
import { StatusBar } from '@/components/social/StatusBar';
import { ComposeSheet } from '@/components/social/ComposeSheet';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSheet } from '@/components/ui/Sheet';
import { useUser } from '@/components/UserProvider';
import { useStatuses } from '@/lib/statuses';
import { VerifyBanner } from '@/components/shell/VerifyBanner';

export default function Page() {
  const { openSheet } = useSheet();
  const { user } = useUser();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const statuses = useStatuses();

  function load() {
    setLoading(true);
    fetch('/api/posts')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPosts(d.posts); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <header className="topbar">
        <span style={{ width: 42 }} />
        <h1>Home</h1>
        <div className="topbar-actions">
          <Link className="ib" href="/app/search" aria-label="Search"><Icon name="search" /></Link>
          <Link className="ib" href="/app/notifications" aria-label="Activity"><Icon name="bell" /></Link>
          <Link className="ib" href="/app/messages" aria-label="Messages"><Icon name="send" /></Link>
        </div>
      </header>

      <div className="page fresh">
        <VerifyBanner />
        <StatusBar groups={statuses.groups} mine={statuses.mine} onSeen={statuses.markSeen} onAdd={statuses.add} onRefresh={statuses.reload} />
        
        <button onClick={() => openSheet(<ComposeSheet onPosted={load} />)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 14px 8px 10px', border: '1px solid var(--ln)', borderRadius: 22, margin: '2px 0 6px', width: '100%', boxShadow: 'var(--sh)', textAlign: 'left', background: 'var(--bg)' }}>
          <Avatar name={user?.displayName || 'You'} src={user?.avatar || undefined} size="sm" />
          <span style={{ flex: 1, padding: '8px 4px', color: 'var(--t2)' }}>What&apos;s on your mind?</span>
          <Icon name="img" />
        </button>

        {loading && <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Loading…</p>}
        {!loading && posts.length === 0 && <EmptyState icon="home" title="Nothing here yet">Follow people to fill this tab.</EmptyState>}
        {posts.map((p) => <PostCard key={p.id} post={p} onChanged={load} />)}
      </div>
    </>
  );
}
