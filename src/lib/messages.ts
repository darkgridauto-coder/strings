'use client';
import { useEffect, useState } from 'react';

export type Voice = { data: string; duration: number };
export type Message = {
  id: string;
  from: 'me' | 'other';
  text?: string;
  voice?: Voice;
  time: number;
  reactions?: string[];
};

export const EMOJIS = ['❤️', '👍', '😂', '😮', '🙏'];

export function useMessages(handle: string) {
  const key = `strings-msgs-${handle}`;
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setMessages(raw ? (JSON.parse(raw) as Message[]) : []);
    } catch { setMessages([]); }
  }, [key]);

  function save(next: Message[]) {
    setMessages(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }

  function send(m: Omit<Message, 'id' | 'time'>) {
    save([...messages, { ...m, id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6), time: Date.now() }]);
  }

  function react(id: string, emoji: string) {
    save(messages.map((m) => {
      if (m.id !== id) return m;
      const r = m.reactions || [];
      return { ...m, reactions: r.includes(emoji) ? r.filter((x) => x !== emoji) : [...r, emoji] };
    }));
  }

  return { messages, send, react };
}
