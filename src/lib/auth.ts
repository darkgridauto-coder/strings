import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

const COOKIE_NAME = 'strings_session';
const PENDING_COOKIE = 'strings_2fa_pending';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const PENDING_MAX_AGE = 60 * 5;

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is not set.');
    console.warn('[auth] JWT_SECRET not set. Dev fallback.');
    return 'dev-only-secret-change-me';
  }
  if (s === 'dev-only-secret-change-me' && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is the dev default.');
  return s;
}

export interface SessionPayload { userId: string; handle: string; role: string; sessionId?: string }

export function hashToken(t: string) { return crypto.createHash('sha256').update(t).digest('hex'); }
export async function hashPassword(p: string) { return bcrypt.hash(p, 10); }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }

export function signSession(p: SessionPayload) { return jwt.sign(p, getJwtSecret(), { expiresIn: '30d' }); }
export function verifySession(t: string) { try { return jwt.verify(t, getJwtSecret()) as SessionPayload; } catch { return null; } }

const sessionCache = new Map<string, { valid: boolean; expiresAt: number }>();
const CACHE_TTL = 60 * 1000;

async function isSessionValid(id: string): Promise<boolean> {
  const c = sessionCache.get(id);
  if (c && c.expiresAt > Date.now()) return c.valid;
  try {
    const row = await prisma.session.findUnique({ where: { id }, select: { revokedAt: true, expiresAt: true, user: { select: { suspended: true } } } });
    const valid = !!row && !row.revokedAt && row.expiresAt > new Date() && !row.user.suspended;
    sessionCache.set(id, { valid, expiresAt: Date.now() + CACHE_TTL });
    return valid;
  } catch { return false; }
}

export function invalidateSessionCache(id: string) { sessionCache.delete(id); }

export async function getSession(): Promise<SessionPayload | null> {
  const t = cookies().get(COOKIE_NAME)?.value;
  if (!t) return null;
  const p = verifySession(t);
  if (!p) return null;
  if (!p.sessionId) return null;
  if (!(await isSessionValid(p.sessionId))) return null;
  return p;
}

export async function createSession(payload: SessionPayload, meta: { userAgent?: string; ip?: string } = {}): Promise<string> {
  const row = await prisma.session.create({
    data: {
      userId: payload.userId,
      tokenHash: crypto.randomUUID(),
      userAgent: meta.userAgent || '',
      ip: meta.ip || '',
      expiresAt: new Date(Date.now() + COOKIE_MAX_AGE * 1000),
    },
  });
  const token = signSession({ ...payload, sessionId: row.id });
  await prisma.session.update({ where: { id: row.id }, data: { tokenHash: hashToken(token) } });
  return token;
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const t = cookies().get(COOKIE_NAME)?.value;
  if (t) {
    const p = verifySession(t);
    if (p?.sessionId) {
      try {
        await prisma.session.update({ where: { id: p.sessionId }, data: { revokedAt: new Date() } });
        invalidateSessionCache(p.sessionId);
      } catch {}
    }
  }
  cookies().delete(COOKIE_NAME);
}

export async function revokeAllSessionsForUser(userId: string) {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  sessionCache.clear();
}

export function signPending2FA(p: SessionPayload) { return jwt.sign({ ...p, _pending2fa: true }, getJwtSecret(), { expiresIn: '5m' }); }
export function setPending2FACookie(t: string) {
  cookies().set(PENDING_COOKIE, t, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: PENDING_MAX_AGE });
}
export function getPending2FA() {
  const t = cookies().get(PENDING_COOKIE)?.value;
  if (!t) return null;
  try {
    const d = jwt.verify(t, getJwtSecret()) as SessionPayload & { _pending2fa?: boolean };
    if (!d._pending2fa) return null;
    return { userId: d.userId, handle: d.handle, role: d.role };
  } catch { return null; }
}
export function clearPending2FACookie() { cookies().delete(PENDING_COOKIE); }
