import { prisma } from '@/lib/db';
import { sendPushToUser } from '@/lib/push';

export async function notify(
  userId: string,
  kind: 'like' | 'comment' | 'follow' | 'mention' | 'message',
  body: string,
  link: string
) {
  // Respect the recipient's saved activity and delivery-channel preferences.
  let settings: Record<string, unknown>;
  try {
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    if (!recipient) return;
    settings = JSON.parse(recipient.settings || '{}');
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      settings = {};
    }
  } catch {
    // Fail closed: do not send a notification when preferences cannot be read.
    return;
  }

  const activityKey = kind === 'follow' ? 'notifFol' : kind === 'message' ? 'notifMsg' : 'notifRea';
  if (settings[activityKey] === false) return;

  if (settings.notifInapp !== false) {
    try {
      await prisma.notification.create({ data: { userId, kind, body, link } });
    } catch {}
  }

  if (settings.notifPush === true) {
    try {
      await sendPushToUser(userId, {
        title: 'Strings',
        body,
        link: link.startsWith('http')
          ? link
          : `${process.env.NEXT_PUBLIC_APP_URL || ''}${link}`,
        tag: `${kind}:${link}`,
      });
    } catch {}
  }
}
