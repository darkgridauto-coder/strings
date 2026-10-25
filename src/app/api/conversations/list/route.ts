import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });

  const raw = await prisma.conversation.findMany({
    where: { participants: { some: { id: s.userId } }, status: { in: ['accepted', 'group', 'pending'] } },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: { select: { id: true, handle: true, displayName: true, avatar: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { id: true, body: true, senderId: true, createdAt: true, mediaKind: true } },
    },
  });

  // Sort: accepted first, then by updatedAt
  raw.sort((a, b) => {
    const rank = (c: typeof a) => c.status === 'accepted' ? 2 : c.status === 'group' ? 2 : 1;
    if (rank(a) !== rank(b)) return rank(b) - rank(a);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Dedupe by peer handle (or group id for groups)
  const seen = new Set<string>();
  const conversations = raw.filter((c) => {
    const key = c.groupName ? `group:${c.id}` : `dm:${c.participants.find((p) => p.handle !== s.handle)?.handle || c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Unread count
  const reads = await prisma.readReceipt.findMany({ where: { userId: s.userId } });
  const lastReadMap: Record<string, Date> = {};
  reads.forEach((r) => { lastReadMap[r.conversationId] = r.lastReadAt; });

  const unreadIds: string[] = [];
  for (const c of conversations) {
    const last = c.messages[0];
    if (!last || last.senderId === s.userId) continue;
    const lastRead = lastReadMap[c.id];
    if (lastRead && last.createdAt <= lastRead) continue;
    unreadIds.push(c.id);
  }

  return NextResponse.json({ ok: true, conversations, unreadIds });
}
