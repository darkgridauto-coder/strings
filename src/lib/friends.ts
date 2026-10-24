import { prisma } from '@/lib/db';

export async function areFriends(aId: string, bId: string): Promise<boolean> {
  if (aId === bId) return true;
  const rows = await prisma.follow.findMany({
    where: {
      status: 'accepted',
      OR: [
        { followerId: aId, followingId: bId },
        { followerId: bId, followingId: aId },
      ],
    },
  });
  return rows.length === 2;
}

export async function isAcceptedFollower(followerId: string, followingId: string): Promise<boolean> {
  const row = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return row?.status === 'accepted';
}
