'use client';
import { useCallback, useEffect, useState } from 'react';

export type StatusSlide = {
  id: string;
  body: string;
  bg: number;
  img: string;
  createdAt: string;
  viewed: boolean;
  viewCount: number;
  isMine: boolean;
};

export type StatusGroup = {
  user: { id: string; handle: string; displayName: string; avatar?: string | null };
  items: StatusSlide[];
  hasUnseen: boolean;
};

export function useStatuses() {
  const [groups, setGroups] = useState<StatusGroup[]>([]);
  const [mine, setMine] = useState<StatusGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const r = await fetch('/api/statuses');
      const d = await r.json();
      if (d.ok) {
        setGroups(d.groups || []);
        setMine(d.mine || null);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function add(body: string, bg: number, img?: string) {
    await fetch('/api/statuses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, bg, img: img || '' }),
    });
    reload();
  }

  async function markSeen(statusId: string) {
    await fetch(`/api/statuses/${statusId}/view`, { method: 'POST' });
  }

  return { groups, mine, loading, add, markSeen, reload };
}

export const STATUS_BG: [string, string][] = [
  ['#0a0a0a', '#ffffff'],
  ['#3a3a3a', '#ffffff'],
  ['#f2f2f2', '#000000'],
];
