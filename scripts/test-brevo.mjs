import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

function get(k) {
  const re = new RegExp('^' + k + '="([^"]*)"', 'm');
  const m = env.match(re);
  return m ? m[1] : '';
}

const key = get('BREVO_API_KEY');
const from = get('BREVO_SENDER_EMAIL');
const name = get('BREVO_SENDER_NAME') || 'Strings';

console.log('--- Configuration check ---');
console.log('API key present:    ', Boolean(key));
console.log('API key format:     ', key.startsWith('xkeysib-') ? 'correct (xkeysib-…)' : key ? 'WRONG (does not start with xkeysib-)' : 'missing');
console.log('Sender email:       ', from || 'MISSING');
console.log('Sender name:        ', name);

if (!key || !key.startsWith('xkeysib-')) {
  console.error('');
  console.error('FIX: add BREVO_API_KEY="xkeysib-..." to .env');
  process.exit(1);
}
if (!from) {
  console.error('');
  console.error('FIX: add BREVO_SENDER_EMAIL="..." to .env (must be a verified sender in Brevo)');
  process.exit(1);
}

console.log('');
console.log('--- Sending test email ---');
console.log('To:', from);
console.log('');

try {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name, email: from },
      to: [{ email: from }],
      subject: 'Strings · Brevo test',
      htmlContent:
        '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">' +
        '<h1 style="letter-spacing:.3em;font-size:13px;text-transform:uppercase">STRINGS</h1>' +
        '<h2>Brevo is working</h2>' +
        '<p>Your Strings app is correctly configured to send transactional email through Brevo.</p>' +
        '<p style="color:#999;font-size:13px">Sent at ' + new Date().toISOString() + '</p>' +
        '</div>',
    }),
  });

  const bodyText = await res.text();

  if (res.ok) {
    console.log('✔ SUCCESS — Brevo accepted the request');
    console.log('');
    console.log('  Check your inbox at', from, 'within 30 seconds.');
    console.log('  If not in inbox, check spam and Brevo → Transactional → Logs.');
    console.log('');
    console.log('  Response:', bodyText.slice(0, 200));
  } else {
    console.error('✗ FAILED — Brevo returned HTTP', res.status);
    console.error('');
    console.error('  Response body:');
    console.error('  ' + bodyText.slice(0, 600));
    console.error('');
    if (res.status === 401) {
      console.error('  → API key is wrong, revoked, or expired.');
      console.error('    Generate a new one at https://app.brevo.com/settings/keys/api');
    } else if (res.status === 403) {
      console.error('  → API key is missing a required permission.');
      console.error('    Edit key → Transactional email → set to "Read" or "All".');
    } else if (bodyText.toLowerCase().includes('sender')) {
      console.error('  → Sender email is not verified in Brevo.');
      console.error('    https://app.brevo.com/senders/list — add and verify', from);
    } else if (bodyText.toLowerCase().includes('invalid')) {
      console.error('  → Invalid input. Check BREVO_SENDER_EMAIL format.');
    }
    process.exit(1);
  }
} catch (e) {
  console.error('✗ Network error:', e.message);
  console.error('');
  console.error('  → Could be: no internet, Brevo API down, or DNS blocked.');
  process.exit(1);
}
