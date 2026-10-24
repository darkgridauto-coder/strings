import crypto from 'crypto';
const TTL_MS = 10 * 60 * 1000;

export function generateCode(): string {
  return String(crypto.randomInt(100000, 1000000));
}
export function hashCode(code: string): string {
  return crypto.createHash('sha256').update('strings.verify|' + code.trim()).digest('hex');
}
export function codeExpiry(): Date { return new Date(Date.now() + TTL_MS); }
export function cooldownRemaining(last: Date | null | undefined): number {
  if (!last) return 0;
  const r = 60_000 - (Date.now() - last.getTime());
  return r > 0 ? Math.ceil(r / 1000) : 0;
}
