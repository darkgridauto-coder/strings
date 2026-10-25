'use client';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { STATUS_BG, type StatusGroup } from '@/lib/statuses';

export function StatusViewer({
  group, startIndex, onSeen, onClose,
}: { group: StatusGroup; startIndex: number; onSeen: (id: string) => void; onClose: () => void }) {
  const [i, setI] = useState(startIndex);

  useEffect(() => {
    const s = group.items[i];
    if (!s) return;
    if (!s.isMine) onSeen(s.id);
    const to = setTimeout(() => { if (i < group.items.length - 1) setI(i + 1); else onClose(); }, 4500);
    return () => clearTimeout(to);
  }, [i, group.items, onSeen, onClose]);

  const s = group.items[i];
  if (!s) return null;
  const [bg, tx] = STATUS_BG[s.bg] || STATUS_BG[0];

  function next(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3 && i > 0) setI(i - 1);
    else if (i < group.items.length - 1) setI(i + 1);
    else onClose();
  }

  return (
    <div className="ov on" role="dialog" aria-modal="true">
      <div style={{ display: 'flex', gap: 4, padding: '14px 14px 8px' }}>
        {group.items.map((_, j) => (
          <div key={j} style={{ flex: 1, height: 3, borderRadius: 2, background: j <= i ? '#fff' : 'rgba(255,255,255,.25)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '4px 14px 10px' }}>
        <Avatar name={group.user.displayName} src={group.user.avatar || undefined} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{s.isMine ? 'Your status' : group.user.displayName}</b>
          <br />
          <small style={{ color: 'rgba(255,255,255,.65)' }}>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · disappears after 24h</small>
        </div>
        <button className="ib" onClick={onClose} aria-label="Close"><Icon name="x" size={20} /></button>
      </div>
      <div
        onClick={next}
        style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 30, textAlign: 'center', fontSize: '1.9em', fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.15, cursor: 'pointer', margin: '0 8px', borderRadius: 24, background: bg, color: tx, overflow: 'hidden', position: 'relative' }}
      >
        {s.img && <img src={s.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }} />}
        <span style={{ position: 'relative', textShadow: '0 1px 12px rgba(0,0,0,.5)' }}>{s.body || ''}</span>
      </div>
      {s.isMine && (
        <div style={{ padding: '12px 16px calc(18px + env(safe-area-inset-bottom))', textAlign: 'center', fontSize: '.9em', color: 'rgba(255,255,255,.75)' }}>
          <Icon name="eye" size={16} /> {s.viewCount} {s.viewCount === 1 ? 'view' : 'views'}
        </div>
      )}
      <div style={{ height: 8 }} />
    </div>
  );
}
