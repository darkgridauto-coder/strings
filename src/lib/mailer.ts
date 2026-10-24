type SendArgs = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; dev?: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@strings.local';
  const fromName = process.env.BREVO_SENDER_NAME || 'Strings';

  if (!apiKey) {
    console.warn(`[mailer] BREVO_API_KEY not set. Would send to ${to}: ${subject}`);
    return { ok: true, dev: true };
  }

  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('[mailer] Brevo error', r.status, err.slice(0, 300));
      return { ok: false, error: err.slice(0, 300) };
    }
    return { ok: true };
  } catch (e: any) {
    console.error('[mailer] exception', e.message);
    return { ok: false, error: e.message };
  }
}

export function verificationEmail(code: string, displayName: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fff">
  <div style="font-family:Inter,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0a0a0a">
    <p style="font-size:13px;letter-spacing:.4em;text-transform:uppercase;font-weight:700;margin:0 0 24px">STRINGS</p>
    <h1 style="font-size:28px;letter-spacing:-.02em;line-height:1.2;margin:0 0 8px">Verify your email</h1>
    <p style="color:#767676;margin:0 0 24px">Welcome, ${displayName}. Enter this code in Strings to verify your account.</p>
    <div style="background:#f5f5f5;border-radius:16px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:.3em;font-variant-numeric:tabular-nums">${code}</div>
    <p style="color:#767676;font-size:14px;margin:24px 0 0">This code expires in 10 minutes. If you didn't create a Strings account, ignore this email.</p>
    <p style="color:#767676;font-size:13px;margin:32px 0 0">Strings · Connect in transparency... black and white.</p>
  </div></body></html>`;
}
