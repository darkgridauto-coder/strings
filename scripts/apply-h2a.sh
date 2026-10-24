#!/usr/bin/env bash
set -euo pipefail
cd ~/strings-app

write() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  cat > "$path"
}

# ---------- 1. Extend postSchema ----------
write src/lib/validation.ts << 'FILE_END'
import { z } from 'zod';

export const handleRegex = /^[a-z0-9_]{3,20}$/;

export const registerSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(60),
  handle: z.string().regex(handleRegex, 'Username must be 3-20 lowercase letters, numbers, or underscores'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const postSchema = z.object({
  body: z.string().trim().max(500, 'Posts are limited to 500 characters').default(''),
  media: z.string().default(''),
  mediaUrls: z.array(z.string()).max(4).optional(),
  quoteOfId: z.string().cuid().optional().nullable(),
  quoteText: z.string().max(500).optional().default(''),
  poll: z.object({
    question: z.string().trim().min(1).max(120),
    options: z.array(z.string().trim().min(1).max(80)).min(2).max(4),
    closesAt: z.string().optional(),
  }).optional().nullable(),
  isDraft: z.boolean().optional().default(false),
}).refine(
  (d) => d.body.trim().length > 0 || (d.mediaUrls && d.mediaUrls.length > 0) || !!d.quoteOfId || !!d.poll,
  { message: 'Write something, add media, quote a post, or add a poll.' }
);

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(500),
  parentId: z.string().cuid().optional().nullable(),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  replyToId: z.string().cuid().optional().nullable(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().max(160).optional(),
  avatar: z.string().optional(),
  cover: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostInput = z.infer<typeof postSchema>;
FILE_END

# ---------- 2. POST /api/posts (multi-photo, quote, poll, draft) ----------
write src/app/api/posts/route.ts << 'FILE_END'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { postSchema } from '@/lib/validation';
import { requireVerifiedSession } from '@/lib/requireVerified';
import { isEnabled } from '@/lib/platform';

export async function GET(req: NextRequest) {
  const session = getSession();
  const author = req.nextUrl.searchParams.get('author');
  const where: any = author ? { author: { handle: author } } : {};
  where.author = { ...(where.author || {}), suspended: false };
  where.isDraft = false;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatar: true, isPrivate: true, verifiedTier: true } },
      _count: { select: { likes: true, comments: true, reposts: true } },
      repostOf: {
        include: {
          author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      },
      poll: {
        include: {
          options: { include: { _count: { select: { votes: true } } } },
        },
      },
    },
  });

  let likedIds = new Set<string>();
  let savedIds = new Set<string>();
  let votedPolls: Record<string, string> = {};
  if (session && posts.length) {
    const ids = posts.map((p) => p.id);
    const pollIds = posts.map((p) => p.pollId).filter(Boolean) as string[];
    const [likes, saves, votes] = await Promise.all([
      prisma.like.findMany({ where: { userId: session.userId, postId: { in: ids } }, select: { postId: true } }),
      prisma.savedPost.findMany({ where: { userId: session.userId, postId: { in: ids } }, select: { postId: true } }),
      pollIds.length ? prisma.pollVote.findMany({ where: { userId: session.userId, pollId: { in: pollIds } } }) : Promise.resolve([]),
    ]);
    likedIds = new Set(likes.map((l) => l.postId));
    savedIds = new Set(saves.map((s) => s.postId));
    votedPolls = Object.fromEntries(votes.map((v) => [v.pollId, v.optionId]));
  }

  const serialize = (p: any) => ({
    id: p.id,
    body: p.body,
    media: p.media,
    mediaUrls: JSON.parse(p.mediaUrls || '[]'),
    createdAt: p.createdAt,
    editedAt: p.editedAt,
    author: p.author,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    repostCount: p._count.reposts,
    likedByMe: likedIds.has(p.id),
    savedByMe: savedIds.has(p.id),
    quoteText: p.quoteText,
    repostOf: p.repostOf
      ? {
          id: p.repostOf.id,
          body: p.repostOf.body,
          media: p.repostOf.media,
          mediaUrls: JSON.parse(p.repostOf.mediaUrls || '[]'),
          createdAt: p.repostOf.createdAt,
          author: p.repostOf.author,
          likeCount: p.repostOf._count.likes,
          commentCount: p.repostOf._count.comments,
        }
      : null,
    poll: p.poll
      ? {
          id: p.poll.id,
          question: p.poll.question,
          closesAt: p.poll.closesAt,
          options: p.poll.options.map((o: any) => ({
            id: o.id,
            text: o.text,
            votes: o._count.votes,
          })),
          votedOptionId: votedPolls[p.poll.id] || null,
        }
      : null,
  });

  return NextResponse.json({ ok: true, posts: posts.map(serialize) });
}

export async function POST(req: NextRequest) {
  if (!(await isEnabled('posting'))) {
    return NextResponse.json({ ok: false, error: 'Posting is temporarily disabled.' }, { status: 503 });
  }
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const data = parsed.data;

  let pollId: string | undefined;
  if (data.poll) {
    const poll = await prisma.poll.create({
      data: {
        question: data.poll.question,
        closesAt: data.poll.closesAt ? new Date(data.poll.closesAt) : null,
        options: { create: data.poll.options.map((text) => ({ text })) },
      },
    });
    pollId = poll.id;
  }

  let mediaUrlsJson = '[]';
  if (data.mediaUrls && data.mediaUrls.length > 0) {
    mediaUrlsJson = JSON.stringify(data.mediaUrls.slice(0, 4));
  } else if (data.media) {
    mediaUrlsJson = JSON.stringify([data.media]);
  }

  const post = await prisma.post.create({
    data: {
      authorId: v.userId,
      body: data.body,
      media: data.media || '',
      mediaUrls: mediaUrlsJson,
      quoteText: data.quoteText || '',
      repostOfId: data.quoteOfId || null,
      pollId: pollId || null,
      isDraft: data.isDraft || false,
    },
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
    },
  });
  return NextResponse.json({ ok: true, post });
}
FILE_END

# ---------- 3. GET + PATCH for post detail ----------
write "src/app/api/posts/[id]/route.ts" << 'FILE_END'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
      _count: { select: { likes: true, comments: true, reposts: true } },
      repostOf: {
        include: {
          author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      },
      poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, handle: true, displayName: true, avatar: true } },
          replies: {
            include: { author: { select: { id: true, handle: true, displayName: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!post) return NextResponse.json({ ok: false }, { status: 404 });

  // Bump view count (fire-and-forget, ignores errors)
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  let likedByMe = false;
  let savedByMe = false;
  let votedOptionId: string | null = null;
  if (session) {
    const [like, save, vote] = await Promise.all([
      prisma.like.findUnique({ where: { userId_postId: { userId: session.userId, postId: post.id } } }),
      prisma.savedPost.findUnique({ where: { userId_postId: { userId: session.userId, postId: post.id } } }),
      post.pollId ? prisma.pollVote.findUnique({ where: { pollId_userId: { pollId: post.pollId, userId: session.userId } } }) : Promise.resolve(null),
    ]);
    likedByMe = !!like;
    savedByMe = !!save;
    votedOptionId = vote?.optionId || null;
  }

  return NextResponse.json({
    ok: true,
    post: {
      ...post,
      mediaUrls: JSON.parse(post.mediaUrls || '[]'),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      repostCount: post._count.reposts,
      likedByMe,
      savedByMe,
      poll: post.poll
        ? {
            id: post.poll.id,
            question: post.poll.question,
            closesAt: post.poll.closesAt,
            options: post.poll.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
            votedOptionId,
          }
        : null,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
  if (post.authorId !== s.userId) return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });
  if (post.repostOfId) return NextResponse.json({ ok: false, error: 'Reposts cannot be edited' }, { status: 400 });
  if (post.pollId) return NextResponse.json({ ok: false, error: 'Posts with polls cannot be edited' }, { status: 400 });

  const body = await req.json();
  const newBody = String(body.body || '').trim();
  if (!newBody) return NextResponse.json({ ok: false, error: 'Body cannot be empty' }, { status: 400 });
  if (newBody.length > 500) return NextResponse.json({ ok: false, error: 'Posts are limited to 500 characters' }, { status: 400 });

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: { body: newBody, editedAt: new Date() },
  });
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const s = getSession();
  if (!s) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
  if (post.authorId !== s.userId) return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });
  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
FILE_END

# ---------- 4. POST /api/posts/[id]/repost ----------
write "src/app/api/posts/[id]/repost/route.ts" << 'FILE_END'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireVerifiedSession } from '@/lib/requireVerified';
import { notify } from '@/lib/notify';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

  const original = await prisma.post.findUnique({
    where: { id: params.id },
    include: { author: { select: { id: true, handle: true } } },
  });
  if (!original) return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
  if (original.repostOfId) return NextResponse.json({ ok: false, error: 'Cannot repost a repost' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const quoteText = String(body.quoteText || '').trim().slice(0, 500);
  const isRepost = !quoteText;

  // Plain repost: one per user per post
  if (isRepost) {
    const existing = await prisma.post.findFirst({
      where: { authorId: v.userId, repostOfId: params.id, quoteText: '' },
    });
    if (existing) return NextResponse.json({ ok: false, error: 'Already reposted' }, { status: 409 });
  }

  const repost = await prisma.post.create({
    data: {
      authorId: v.userId,
      body: '',
      quoteText,
      repostOfId: params.id,
    },
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
    },
  });

  if (original.authorId !== v.userId) {
    await notify(
      original.authorId,
      'mention',
      `@${v.handle} ${isRepost ? 'reposted' : 'quoted'} your post`,
      `/app/posts/${repost.id}`
    );
  }

  return NextResponse.json({ ok: true, post: repost });
}
FILE_END

# ---------- 5. POST /api/polls/[id]/vote ----------
write "src/app/api/polls/[id]/vote/route.ts" << 'FILE_END'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireVerifiedSession } from '@/lib/requireVerified';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const v = await requireVerifiedSession();
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

  const poll = await prisma.poll.findUnique({ where: { id: params.id }, include: { options: true } });
  if (!poll) return NextResponse.json({ ok: false, error: 'Poll not found' }, { status: 404 });
  if (poll.closesAt && poll.closesAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'Poll is closed' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const optionId = String(body.optionId || '');
  if (!poll.options.some((o) => o.id === optionId)) {
    return NextResponse.json({ ok: false, error: 'Invalid option' }, { status: 400 });
  }

  const existing = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId: params.id, userId: v.userId } },
  });
  if (existing) return NextResponse.json({ ok: false, error: 'Already voted' }, { status: 409 });

  await prisma.pollVote.create({
    data: { pollId: params.id, optionId, userId: v.userId },
  });

  const updated = await prisma.poll.findUnique({
    where: { id: params.id },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  });

  return NextResponse.json({
    ok: true,
    poll: {
      id: updated!.id,
      question: updated!.question,
      closesAt: updated!.closesAt,
      options: updated!.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
      votedOptionId: optionId,
    },
  });
}
FILE_END

echo ""
echo "=================================================="
echo " H2a written — 5 API files"
echo "=================================================="
echo " Run: cd ~/strings-app && npm run typecheck"
echo "=================================================="
