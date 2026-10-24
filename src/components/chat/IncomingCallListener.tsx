'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from './SocketProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

// Lazy-load LiveKit only when a call is actually accepted
const RealCallOverlay = dynamic(
  () => import('./RealCallOverlay').then((m) => ({ default: m.RealCallOverlay })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: '#000', color: '#fff',
          display: 'grid', placeItems: 'center',
        }}
      >
        Loading call…
      </div>
    ),
  }
);

type Incoming = { fromHandle: string; roomName: string; video: boolean };

export function IncomingCallListener() {
  const socket = useSocket();
  const [call, setCall] = useState<Incoming | null>(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onIncoming = (d: Incoming) => { if (!inCall) setCall(d); };
    const onEnded = () => { setCall(null); setInCall(false); };
    const onCancelled = () => { setCall(null); setInCall(false); };
    socket.on('incoming-call', onIncoming);
    socket.on('call-ended', onEnded);
    socket.on('call-cancelled', onCancelled);
    return () => {
      socket.off('incoming-call', onIncoming);
      socket.off('call-ended', onEnded);
      socket.off('call-cancelled', onCancelled);
    };
  }, [socket, inCall]);

  useEffect(() => {
    if (!call || !socket) return;
    const to = setTimeout(() => {
      socket.emit('call-response', { roomName: call.roomName, accepted: false });
      setCall(null);
    }, 45000);
    return () => clearTimeout(to);
  }, [call, socket]);

  function accept() {
    if (!call || !socket) return;
    socket.emit('call-response', { roomName: call.roomName, accepted: true });
    setInCall(true);
  }
  function decline() {
    if (!call || !socket) return;
    socket.emit('call-response', { roomName: call.roomName, accepted: false });
    setCall(null);
  }

  if (inCall && call) {
    return (
      <RealCallOverlay
        handle={call.fromHandle}
        roomName={call.roomName}
        video={call.video}
        onClose={() => { setInCall(false); setCall(null); }}
      />
    );
  }
  if (!call) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'grid', placeItems: 'center', zIndex: 999 }}>
      <div className="card" style={{ textAlign: 'center', width: 320, background: 'var(--bg)' }}>
        <Avatar name={call.fromHandle} size="lg" />
        <h3 style={{ marginTop: 12 }}>@{call.fromHandle} is calling…</h3>
        <p className="muted" style={{ marginTop: 4, marginBottom: 20 }}>{call.video ? 'Video call' : 'Voice call'}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button variant="primary" onClick={accept}>Accept</Button>
          <Button variant="outline" onClick={decline}>Decline</Button>
        </div>
      </div>
    </div>
  );
}
