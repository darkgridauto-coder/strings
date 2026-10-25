'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/components/chat/SocketProvider';

export function NotificationBadge({ type, children }: { type: 'messages' | 'notifications', children: React.ReactNode }) {
  const socket = useSocket();
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    const fetchCount = () => {
      if (type === 'messages') {
        fetch('/api/conversations/list').then(r => r.json()).then(d => {
          if (d.ok) setCount(d.unreadIds?.length || 0);
        });
      } else {
        fetch('/api/notifications').then(r => r.json()).then(d => {
          if (d.ok) setCount(d.unread || 0);
        });
      }
    };
    fetchCount();

    if (!socket) return;
    socket.on('message', fetchCount);
    socket.on('notification', fetchCount);
    return () => {
      socket.off('message', fetchCount);
      socket.off('notification', fetchCount);
    };
  }, [socket, type]);

  if (count === 0) return <>{children}</>;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      <span style={{
        position: 'absolute', top: -4, right: -8,
        background: '#ff3b30', color: '#fff', fontSize: 10,
        fontWeight: 'bold', padding: '2px 5px', borderRadius: 10,
        border: '2px solid var(--bg)'
      }}>
        {count > 9 ? '9+' : count}
      </span>
    </div>
  );
}
