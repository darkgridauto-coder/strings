import { prisma } from '@/lib/db';
import { sendPushToUser } from '@/lib/push';
import { sendEmail } from '@/lib/mailer';

function inQuietHours(settings: Record<string, unknown>): boolean {
  if (settings.qhOn !== true) return false;
  const now = new Date();
  const [sh, sm] = String(settings.qhStart || '22:00').split(':').map(Number);
  const [eh, em] = String(settings.qhEnd || '07:00').split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const curMin = now.getHours() * 60 + now.getMinutes();
  if (startMin === endMin) return false;
  return startMin <= endMin
    ? curMin >= startMin && curMin < endMin
    : curMin >= startMin || curMin < endMin;
}

export async function notify(
  userId: string,
  kind: 'like' | 'comment' | 'follow' | 'mention' | 'message',
  body: string,
  link: string
) {
  let settings: Record<string, unknown>;
  let email: string | null = null;
  let emailVerified = false;

  try {
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true, email: true, emailVerified: true },
    });
    if (!recipient) return;
    settings = JSON.parse(recipient.settings || '{}');
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {};
    email = recipient.email;
    emailVerified = recipient.emailVerified;
  } catch (e) {
    console.error('[notify] failed to read recipient settings', e);
    return;
  }

  const activityKey = kind === 'follow' ? 'notifFol' : kind === 'message' ? 'notifMsg' : 'notifRea';
  if (settings[activityKey] === false) return;

  if (settings.notifInapp !== false) {
    try {
      await prisma.notification.create({ data: { userId, kind, body, link } });
    } catch (e) {
      console.error('[notify] in-app insert failed', e);
    }
  }

  const quiet = inQuietHours(settings);
  const absolute = link.startsWith('http')
    ? link
    : (process.env.NEXT_PUBLIC_APP_URL || '') + link;

  if (!quiet && settings.notifPush === true) {
    try {
      await sendPushToUser(userId, {
        title: 'Strings',
        body,
        link: absolute,
        tag: kind + ':' + link,
      });
    } catch (e) {
      console.error('[notify] push failed', e);
    }
  }

  if (!quiet && settings.notifEmail === true && emailVerified && email) {
    try {
      await sendEmail({
        to: email,
        subject: 'New activity on Strings',
        html:
          '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">' +
          '<p style="font-size:12px;letter-spacing:.3em;text-transform:uppercase;font-weight:700">STRINGS</p>' +
          '<p style="font-size:16px;line-height:1.5">' + body + '</p>' +
          '<p><a href="' + absolute + '" style="display:inline-block;padding:10px 20px;background:#0a0a0a;color:#fff;border-radius:8px;text-decoration:none">Open Strings</a></p>' +
          '<p style="color:#999;font-size:12px;margin-top:24px">You can turn this off in Settings → Notifications.</p>' +
          '</div>',
      });
    } catch (e) {
      console.error('[notify] email failed', e);
    }
  }
}
