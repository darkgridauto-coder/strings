'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedSeal } from '@/components/ui/VerifiedSeal';

export type QuotePost = {
  id: string;
  body: string;
  mediaUrls?: string[];
  createdAt: string;
  author: {
    handle: string;
    displayName: string;
    avatar?: string | null;
    verifiedTier?: string;
  };
};

export function QuoteCard({ post }: { post: QuotePost }) {
  const preview = post.body.length > 200 ? post.body.slice(0, 200) + '…' : post.body;
  const firstImage = post.mediaUrls && post.mediaUrls[0];

  return (
    <Link
      href={`/app/posts/${post.id}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'block',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 12,
        marginTop: 10,
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <Avatar name={post.author.displayName} src={post.author.avatar || undefined} size="sm" />
        <div style={{ minWidth: 0 }}>
          <b style={{ display: 'inline-flex', alignItems: 'center', fontSize: '.9em' }}>
            {post.author.displayName}
            {post.author.verifiedTier ? <VerifiedSeal tier={post.author.verifiedTier} size={14} /> : null}
          </b>
          <small className="muted" style={{ fontSize: '.78em', display: 'block' }}>
            @{post.author.handle} · {new Date(post.createdAt).toLocaleDateString()}
          </small>
        </div>
      </div>
      {preview && <p style={{ margin: 0, fontSize: '.92em', lineHeight: 1.5 }}>{preview}</p>}
      {firstImage && (
        <img
          src={firstImage}
          alt=""
          style={{
            width: '100%',
            maxHeight: 160,
            objectFit: 'cover',
            borderRadius: 10,
            marginTop: 8,
            display: 'block',
          }}
        />
      )}
    </Link>
  );
}
