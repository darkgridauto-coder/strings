'use client';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

export type Post = {
  id: string;
  author: { name: string; handle: string; avatar?: string };
  body: string;
  media?: string;
  time: string;
  likes: number;
  comments: number;
};

export function PostCard({ post, onLike, onSave, onOpen }: {
  post: Post; onLike?: () => void; onSave?: () => void; onOpen?: () => void;
}) {
  return (
    <article className="post-card">
      <div className="post-head">
        <Link href={`/app/u/${post.author.handle}`}><Avatar name={post.author.name} src={post.author.avatar} /></Link>
        <div className="post-head-body">
          <Link href={`/app/u/${post.author.handle}`}><b>{post.author.name}</b></Link>
          <span className="muted" style={{ fontSize: '.85em' }}>@{post.author.handle} · {post.time}</span>
        </div>
        <button aria-label="More" style={{ padding: 8 }}><Icon name="more" /></button>
      </div>
      <div className="post-body" onClick={onOpen} style={{ cursor: onOpen ? 'pointer' : 'default' }}>
        <p>{post.body}</p>
        {post.media ? <img src={post.media} alt="" className="post-media" /> : null}
      </div>
      <div className="post-actions">
        <button onClick={onLike} aria-label="Like"><Icon name="heart" size={18} />{post.likes}</button>
        <button onClick={onOpen} aria-label="Comment"><Icon name="chat" size={18} />{post.comments}</button>
        <button aria-label="Share"><Icon name="share" size={18} /></button>
        <span style={{ flex: 1 }} />
        <button onClick={onSave} aria-label="Save"><Icon name="save" size={18} /></button>
      </div>
    </article>
  );
}
