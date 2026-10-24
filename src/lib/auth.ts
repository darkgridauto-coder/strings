import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const COOKIE_NAME = 'strings_session';
const PENDING_COOKIE = 'strings_2fa_pending';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const PENDING_MAX_AGE = 60 * 5;

export interface SessionPayload {
  userId: string;
  handle: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
export function verifySession(token: string): SessionPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as SessionPayload; } catch { return null; }
}
export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: COOKIE_MAX_AGE,
  });
}
export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function signPending2FA(payload: SessionPayload): string {
  return jwt.sign({ ...payload, _pending2fa: true }, JWT_SECRET, { expiresIn: '5m' });
}
export function setPending2FACookie(token: string) {
  cookies().set(PENDING_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: PENDING_MAX_AGE,
  });
}
export function getPending2FA(): SessionPayload | null {
  const token = cookies().get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload & { _pending2fa?: boolean };
    if (!decoded._pending2fa) return null;
    return { userId: decoded.userId, handle: decoded.handle, role: decoded.role };
  } catch { return null; }
}
export function clearPending2FACookie() {
  cookies().delete(PENDING_COOKIE);
}
