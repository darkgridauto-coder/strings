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
            title={isRepost ? 'Delete repost' : 'Delete post'}
            sub={isRepost ? 'Removes your repost · original stays up' : 'Removes it for everyone · cannot be undone'}
            onClick={deletePost}
          />
        ) : (
          <Row
            icon="info"
            title="Report post"
            sub="Flag this for moderation"
            onClick={async () => {
            closeSheet();
            const reasons = ['Spam', 'Harassment', 'Hate speech', 'Misinformation', 'Something else'];
            const choice = window.prompt('Reason for reporting:\n' + reasons.map((r, i) => (i + 1) + '. ' + r).join('\n'), '1');
            const idx = parseInt(choice || '0', 10) - 1;
            if (idx < 0 || idx >= reasons.length) return;
            try {
              const r = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetType: 'post', targetId: post.id, reason: reasons[idx] }),
              });
              const d = await r.json();
              if (d.ok) showToast('Report submitted for review');
              else showToast(d.error || 'Could not report');
            } catch { showToast('Network error'); }
          }}
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

  function renderHeader(author: { id?: string; handle: string; displayName: string; avatar?: string | null; verifiedTier?: string }, createdAt: string, editedAt?: string | null, showMenu = true) {
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
