'use client';
const B64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const UB = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export type VaultNote = {
  id: string;
  title: string;
  salt: string;
  iv: string;
  ct: string;
  oneShot: boolean;
  createdAt: number;
};

export async function encryptNote(title: string, body: string, passphrase: string, oneShot: boolean): Promise<VaultNote> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(body));
  return { id: crypto.randomUUID(), title, salt: B64(salt), iv: B64(iv), ct: B64(new Uint8Array(ct)), oneShot, createdAt: Date.now() };
}

export async function decryptNote(note: VaultNote, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase, UB(note.salt));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: UB(note.iv) }, key, UB(note.ct));
  return dec.decode(pt);
}

const KEY = 'strings.vault.notes';
export function loadNotes(): VaultNote[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveNotes(notes: VaultNote[]) { localStorage.setItem(KEY, JSON.stringify(notes)); }
