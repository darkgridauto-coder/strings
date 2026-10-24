'use client';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useSheet } from '@/components/ui/Sheet';
import { StatusViewer } from './StatusViewer';
import { AddStatusSheet } from './AddStatusSheet';
import { ViewersSheet } from './ViewersSheet';
import type { StatusGroup } from '@/lib/statuses';

export function StatusBar({
  groups, mine, onSeen, onAdd, onRefresh,
}: {
  groups: StatusGroup[];
  mine: StatusGroup | null;
  onSeen: (id: string) => void;
  onAdd: (body: string, bg: number, img?: string) => void;
  onRefresh: () => void;
}) {
  const { openSheet } = useSheet();
  const [viewer, setViewer] = useState<{ group: StatusGroup; startIndex: number } | null>(null);

  function openMine() {
    if (mine && mine.items.length > 0) {
      setViewer({ group: mine, startIndex: 0 });
    } else {
      openSheet(<AddStatusSheet onAdd={onAdd} />);
    }
  }

  function showViewers() {
    if (!mine || mine.items.length === 0) return;
    openSheet(<ViewersSheet statusId={mine.items[0].id} viewCount={mine.items[0].viewCount} />);
  }

  return (
    <>
      <div className="stb">
        <button onClick={openMine}>
          <div className={'rg ' + (mine && mine.items.length ? '' : 'none')}>
            <Avatar name="You" />
          </div>
          <span>Your status</span>
        </button>
        {mine && mine.items.length > 0 && (
          <button onClick={showViewers}>
            <div className="rg">
              <Avatar name="You" />
            </div>
            <span>{mine.items.reduce((s, x) => s + x.viewCount, 0)} views</span>
          </button>
        )}
        {groups.filter((g) => !g.items[0].isMine).map((g) => (
          <button key={g.user.id} onClick={() => setViewer({ group: g, startIndex: 0 })}>
            <div className={'rg ' + (g.hasUnseen ? '' : 'seen')}>
              <Avatar name={g.user.displayName} src={g.user.avatar || undefined} />
            </div>
            <span>{g.user.displayName.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      {viewer && (
        <StatusViewer
          group={viewer.group}
          startIndex={viewer.startIndex}
          onSeen={onSeen}
          onClose={() => { setViewer(null); onRefresh(); }}
        />
      )}
    </>
  );
}
