'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { openImage } from '@/components/ui/ImageViewer';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { PostCard, FeedPost } from '@/components/social/PostCard';
import { useStatuses } from '@/lib/statuses';
import { VerifiedSeal } from '@/components/ui/VerifiedSeal';

type User = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatar: string;
  cover: string;
  isPrivate: boolean;
  createdAt: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  viewerFollows: boolean;
  viewerPending: boolean;
  isSelf: boolean;
  verifiedTier?: string;
};

type Tab = 'posts' | 'media' | 'likes' | 'saved';

export function ProfileView({ handle }: { handle: string }) {
  const { showToast } = useToast();
  const statuses = useStatuses();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [liked, setLiked] = useState<FeedPost[]>([]);
  const [saved, setSaved] = useState<FeedPost[]>([]);
  const [tab, setTab] = useState<Tab>('posts');
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    Promise.all([
      fetch(`/api/users/${handle}`).then((r) => r.json()),
      fetch(`/api/posts?author=${handle}`).then((r) => r.json()),
    ])
      .then(([u, p]) => {
        if (u.ok) setUser(u.user);
        if (p.ok) setPosts(p.posts);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { reload(); }, [handle]);

  useEffect(() => {
    if (!user?.isSelf) return;
    fetch('/api/likes').then((r) => r.json()).then((d) => { if (d.ok) setLiked(d.posts); }).catch(() => {});
    fetch('/api/saved').then((r) => r.json()).then((d) => { if (d.ok) setSaved(d.posts); }).catch(() => {});
  }, [user?.isSelf]);

  async function toggleFollow() {
    if (!user) return;
    const wasFollowing = user.viewerFollows;
    try {
      const r = await fetch('/api/follow', {
        method: wasFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: user.handle }),
      });
      const d = await r.json();
      if (!d.ok) { showToast(d.error || 'Failed'); return; }
      showToast(d.message || (wasFollowing ? 'Unfollowed' : 'Following'));
      reload();
    } catch { showToast('Network error'); }
  }

  if (loading) {
    return <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Loading…</p>;
  }
  if (!user) {
    return <EmptyState icon="info" title="Profile not available">This account may not exist or you may not have access.</EmptyState>;
  }

  const isPrivateGate = user.isPrivate && !user.isSelf && !user.viewerFollows;
  const allTabs: Tab[] = user.isSelf ? ['posts', 'media', 'likes', 'saved'] : ['posts', 'media'];

  const visiblePosts: FeedPost[] = isPrivateGate
    ? []
    : tab === 'likes'
      ? liked
      : tab === 'saved'
        ? saved
        : tab === 'media'
          ? posts.filter((p) => p.media)
          : posts;

  const hasHighlights = user.isSelf && statuses.mine && statuses.mine.items.length > 0;

  return (
    <div className="pf fresh">
      <div
        className="cover"
        onClick={user.cover ? () => openImage(user.cover!, user.displayName + ' cover') : undefined}
        role={user.cover ? 'button' : undefined}
        tabIndex={user.cover ? 0 : undefined}
        style={user.cover ? { backgroundImage: `url(${user.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(1)' } : undefined}
      >
        {!user.cover && (user.isSelf ? 'Add a cover photo' : '')}
      </div>

      <div className="pf-main">
        <div className="pf-head">
          <div className="pf-av">
            <Avatar name={user.displayName} src={user.avatar || undefined} size="lg" />
          </div>
          <div className="pf-stats">
            <div><b>{user.postCount}</b><small>Posts</small></div>
            <Link href={`/app/u/${user.handle}/followers`}><b>{user.followerCount}</b><small>Followers</small></Link>
            <Link href={`/app/u/${user.handle}/following`}><b>{user.followingCount}</b><small>Following</small></Link>
          </div>
        </div>

        <div className="pf-name">
          <span>{user.displayName}</span>
          {user.verifiedTier ? <VerifiedSeal tier={user.verifiedTier} size={20} /> : null}
          {user.isPrivate ? <Icon name="lock" size={16} /> : null}
        </div>
        <span className="pf-chip">@{user.handle}</span>
        {user.bio ? <p className="pf-bio">{user.bio}</p> : null}
        <div className="pf-meta">
          <span>
            <Icon name="clock" size={14} /> Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="pf-btns">
          {user.isSelf ? (
            <>
              <Link className="pf-b" href="/app/profile/edit" style={{ display: 'grid', placeItems: 'center' }}>Edit profile</Link>
              <Link className="pf-b sq" href="/app/settings" aria-label="Settings"><Icon name="gear" /></Link>
            </>
          ) : (
            <>
              <button className={`pf-b ${user.viewerFollows ? '' : 'on'}`} onClick={toggleFollow}>
                {user.viewerFollows ? 'Following' : user.viewerPending ? 'Requested' : 'Follow'}
              </button>
              <Link className="pf-b" href={`/app/messages/${user.handle}`}>Message</Link>
            </>
          )}
        </div>

        {hasHighlights && statuses.mine && (
          <div className="pf-hl">
            {statuses.mine.items.map((s) => (
              <div key={s.id} className="hlt">
                <i>{s.img ? <img src={s.img} alt="" /> : (s.body.trim()[0] || '•').toUpperCase()}</i>
                <span>{new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pf-tabs">
          {allTabs.map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isPrivateGate && (
        <EmptyState icon="lock" title="This account is private">Follow {user.displayName} to see their posts and media.</EmptyState>
      )}

      {!isPrivateGate && visiblePosts.length === 0 && (
        <EmptyState icon="doc" title={`No ${tab} yet`}>
          {user.isSelf ? 'Share your first post and it will appear here.' : 'Nothing has been published here yet.'}
        </EmptyState>
      )}

      {!isPrivateGate && visiblePosts.length > 0 && tab === 'posts' && (
        <>
          {visiblePosts.map((p) => <PostCard key={p.id} post={p} onChanged={reload} />)}
        </>
      )}

      {!isPrivateGate && visiblePosts.length > 0 && tab !== 'posts' && (
        <div className="pf-grid">
          {visiblePosts.map((p) => (
            <Link key={p.id} className="gt" href={`/app/posts/${p.id}`}>
              {p.media ? <img src={p.media} alt="" /> : <span style={{ fontSize: '.78em' }}>{p.body.slice(0, 60)}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
