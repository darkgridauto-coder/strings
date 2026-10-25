import { prisma } from '@/lib/db';
import { sendPushToUser } from '@/lib/push';

export async function notify(
  userId: string,
  kind: 'like' | 'comment' | 'follow' | 'mention',
  body: string,
  link: string
) {
  try {
    await prisma.notification.create({ data: { userId, kind, body, link } });
  } catch {}
  try {
    await sendPushToUser(userId, {
      title: 'Strings',
      body,
      link: link.startsWith('http') ? link : `${process.env.NEXT_PUBLIC_APP_URL || ''}${link}`,
      tag: `${kind}:${link}`,
    });
  } catch {}
}
