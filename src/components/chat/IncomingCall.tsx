'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from './SocketProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

export function IncomingCall() {
  const socket = useSocket();
  const router = useRouter();
  const [call, setCall] = useState<{ fromHandle: string, video: boolean } | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('incoming-call', (data) => setCall(data));
    return () => { socket.off('incoming-call'); };
  }, [socket]);

  if (!call) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.9)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ animation: 'pulse 1.5s infinite', borderRadius: '50%', padding: 10 }}>
        <Avatar name={call.fromHandle} size="lg" />
      </div>
      <h2 style={{ marginTop: 20 }}>@{call.fromHandle}</h2>
      <p className="muted">Incoming {call.video ? 'Video' : 'Voice'} Call...</p>
      <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
        <button onClick={() => setCall(null)} aria-label="Decline" style={{ width: 60, height: 60, borderRadius: '50%', background: '#ff3b30', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
          <Icon name="phone" size={24} style={{ transform: 'rotate(135deg)' }} />
        </button>
        <button onClick={() => { router.push(`/app/messages/${call.fromHandle}?call=true`); setCall(null); }} aria-label="Accept" style={{ width: 60, height: 60, borderRadius: '50%', background: '#34c759', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
          <Icon name="phone" size={24} />
        </button>
      </div>
    </div>
  );
}
