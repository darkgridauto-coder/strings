'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function FollowButton({ handle }: { handle: string }) {
  const [state, setState] = useState<'none' | 'pending' | 'following'>('none');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function refresh() {
    try {
      const r = await fetch(`/api/follow/status?handle=${encodeURIComponent(handle)}`);
      const d = await r.json();
      if (d.ok) setState(d.status);
    } catch {}
  }
  useEffect(() => { refresh(); }, [handle]);

  async function toggle() {
    setLoading(true);
    try {
      if (state === 'none') {
        const r = await fetch('/api/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle }) });
        const d = await r.json();
        if (d.ok) { setState(d.pending ? 'pending' : 'following'); showToast(d.message || 'Done'); }
        else showToast(d.error || 'Failed');
      } else {
        const r = await fetch('/api/follow', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle }) });
        if (r.ok) { setState('none'); showToast('Unfollowed'); }
      }
    } finally { setLoading(false); }
  }

  const label = state === 'following' ? 'Following' : state === 'pending' ? 'Requested' : 'Follow';
  const variant = state === 'none' ? 'primary' : 'outline';

  return (
    <Button size="sm" variant={variant} onClick={toggle} disabled={loading}>
      {label}
    </Button>
  );
}
