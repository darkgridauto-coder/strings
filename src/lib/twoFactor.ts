import crypto from 'crypto';

// Self-contained RFC 6238 TOTP implementation. No external dependency.

const DIGITS = 6;
const STEP_SECONDS = 30;
const ALGORITHM = 'sha1';
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32.indexOf(clean[i]);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secretBuf: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  let c = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(c & 0xffn);
    c >>= 8n;
  }
  const hmac = crypto.createHmac(ALGORITHM, secretBuf).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, '0');
}

function totpAt(secret: string, timeMs: number): string {
  const counter = Math.floor(timeMs / 1000 / STEP_SECONDS);
  return hotp(base32Decode(secret), counter);
}

export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function keyUri(secret: string, email: string): string {
  const label = encodeURIComponent(`Strings:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer: 'Strings',
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function verifyCode(secret: string, code: string, windowSteps = 1): boolean {
  const cleaned = code.replace(/[\s-]/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Date.now();
  for (let w = -windowSteps; w <= windowSteps; w++) {
    const t = now + w * STEP_SECONDS * 1000;
    if (totpAt(secret, t) === cleaned) return true;
  }
  return false;
}

export function generateBackupCodes(count = 10): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    out.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return out;
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

export function verifyBackupCode(storedHashes: string[], code: string): { ok: boolean; remaining: string[] } {
  const h = hashCode(code);
  const idx = storedHashes.indexOf(h);
  if (idx === -1) return { ok: false, remaining: storedHashes };
  const remaining = [...storedHashes];
  remaining.splice(idx, 1);
  return { ok: true, remaining };
}
