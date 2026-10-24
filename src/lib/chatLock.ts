'use client';

const PIN_KEY = 'strings.chat.pin'; // sha-256 hash stored
const LOCKED_KEY = 'strings.chat.locked'; // Set of conversationIds that are locked
const SESSION_UNLOCK_KEY = 'strings.chat.unlocked'; // per-tab unlock, cleared on close

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function setPin(pin: string) {
  if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN must be 4–8 digits');
  localStorage.setItem(PIN_KEY, await sha256('strings|' + pin));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return false;
  return stored === (await sha256('strings|' + pin));
}

export function hasPin(): boolean { return !!localStorage.getItem(PIN_KEY); }

export function isLocked(convId: string): boolean {
  try { return (JSON.parse(localStorage.getItem(LOCKED_KEY) || '[]') as string[]).includes(convId); }
  catch { return false; }
}
export function setLocked(convId: string, locked: boolean) {
  let arr: string[] = [];
  try { arr = JSON.parse(localStorage.getItem(LOCKED_KEY) || '[]'); } catch {}
  arr = locked ? [...new Set([...arr, convId])] : arr.filter((x) => x !== convId);
  localStorage.setItem(LOCKED_KEY, JSON.stringify(arr));
}

export function isUnlockedThisSession(convId: string): boolean {
  try { return (JSON.parse(sessionStorage.getItem(SESSION_UNLOCK_KEY) || '[]') as string[]).includes(convId); }
  catch { return false; }
}
export function unlockThisSession(convId: string) {
  let arr: string[] = [];
  try { arr = JSON.parse(sessionStorage.getItem(SESSION_UNLOCK_KEY) || '[]'); } catch {}
  arr = [...new Set([...arr, convId])];
  sessionStorage.setItem(SESSION_UNLOCK_KEY, JSON.stringify(arr));
}

export function isPinned(convId: string): boolean {
  try { return (JSON.parse(localStorage.getItem('strings.chat.pinned') || '[]') as string[]).includes(convId); }
  catch { return false; }
}
export function setPinned(convId: string, pinned: boolean) {
  let arr: string[] = [];
  try { arr = JSON.parse(localStorage.getItem('strings.chat.pinned') || '[]'); } catch {}
  arr = pinned ? [...new Set([...arr, convId])] : arr.filter((x) => x !== convId);
  localStorage.setItem('strings.chat.pinned', JSON.stringify(arr));
}
