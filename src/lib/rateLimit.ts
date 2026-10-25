type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let opCount = 0;

export function rateLimit(key: string, maxRequests: number, windowMs: number): { ok: boolean; retryAfter: number } {
  opCount++;
  if (opCount % 1000 === 0) {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= maxRequests) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  bucket.count++;
  return { ok: true, retryAfter: 0 };
}

export function getClientKey(req: Request, prefix: string): string {
  const h = req.headers;
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return prefix + ':' + ip;
}
