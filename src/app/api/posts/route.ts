import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { postSchema } from '@/lib/validation';
import { requireVerifiedSession } from '@/lib/requireVerified';
import { isEnabled } from '@/lib/platform';

export async function GET(req: NextRequest) {
  try {
    const session = getSession();
    const author = req.nextUrl.searchParams.get('author');

    const where: any = {};
    if (author) where.author = { handle: author };
    else where.author = { suspended: false };
  where.hiddenAt = null;

    const posts = await prisma.post.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 50,
      include: {
        author: { select: { id: true, handle: true, displayName: true, avatar: true, isPrivate: true, verifiedTier: true } },
        _count: { select: { likes: true, comments: true } },
        // RESTORED: Fetch the original post details for reposts/quotes
        repostOf: {
          include: {
            author: { select: { id: true, handle: true, displayName: true, avatar: true, verifiedTier: true } },
            _count: { select: { likes: true, comments: true } }
          }
        },
        poll: {
          include: { options: { include: { _count: { select: { votes: true } } } } }
        }
      },
    });

    let likedIds = new Set<string>();
    let savedIds = new Set<string>();
    if (session && posts.length) {
      const ids = posts.map((p) => p.id);
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({ where: { userId: session.userId, postId: { in: ids } }, select: { postId: true } }),
        prisma.savedPost.findMany({ where: { userId: session.userId, postId: { in: ids } }, select: { postId: true } }),
      ]);
      likedIds = new Set(likes.map((l) => l.postId));
      savedIds = new Set(saves.map((s) => s.postId));
    }

    const pollVotes = session ? await prisma.pollVote.findMany({ where: { userId: session.userId } }) : [];
    const voteMap = new Map(pollVotes.map(v => [v.pollId, v.optionId]));

    return NextResponse.json({
      ok: true,
      posts: posts.map((p: any) => {
        let mediaUrls: string[] = [];
        try { mediaUrls = p.mediaUrls ? JSON.parse(p.mediaUrls) : []; } catch {}
        
        let poll = null;
        if (p.poll) {
          poll = {
            id: p.poll.id, question: p.poll.question, closesAt: p.poll.closesAt,
            options: p.poll.options.map((o: any) => ({ id: o.id, text: o.text, votes: o._count.votes })),
            votedOptionId: voteMap.get(p.poll.id) || null
          };
        }

        // Format the reposted content
        let repostOf = null;
        if (p.repostOf) {
          let repostMediaUrls: string[] = [];
          try { repostMediaUrls = p.repostOf.mediaUrls ? JSON.parse(p.repostOf.mediaUrls) : []; } catch {}
          repostOf = {
            id: p.repostOf.id, body: p.repostOf.body, media: p.repostOf.media,
            mediaUrls: repostMediaUrls,
            createdAt: p.repostOf.createdAt, author: p.repostOf.author,
            likeCount: p.repostOf._count.likes, commentCount: p.repostOf._count.comments,
          };
        }

        return {
          id: p.id, body: p.body, media: p.media || '', mediaUrls,
          createdAt: p.createdAt, editedAt: p.editedAt || null, quoteText: p.quoteText || '',
          author: p.author, likeCount: p._count.likes, commentCount: p._count.comments,
          repostCount: 0, likedByMe: likedIds.has(p.id), savedByMe: savedIds.has(p.id),
          repostOf, poll,
        };
      }),
    });
  } catch (e: any) {
    console.error('[/api/posts GET]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error', posts: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isEnabled('posting'))) return NextResponse.json({ ok: false, error: 'Posting is temporarily disabled.' }, { status: 503 });
    const v = await requireVerifiedSession();
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: v.status });

    const parsed = postSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

    let pollId = null;
    if (parsed.data.poll) {
      const poll = await prisma.poll.create({
        data: { question: parsed.data.poll.question, options: { create: parsed.data.poll.options.map(o => ({ text: o })) } }
      });
      pollId = poll.id;
    }

    const post = await prisma.post.create({
      data: {
        authorId: v.userId, body: parsed.data.body, media: parsed.data.media || '',
        mediaUrls: parsed.data.mediaUrls ? JSON.stringify(parsed.data.mediaUrls) : '[]',
        pollId,
      },
      include: { author: { select: { id: true, handle: true, displayName: true, avatar: true } } },
    });
    return NextResponse.json({ ok: true, post });
  } catch (e: any) {
    console.error('[/api/posts POST]', e?.message || e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
