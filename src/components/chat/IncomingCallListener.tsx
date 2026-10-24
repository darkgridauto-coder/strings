'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from './SocketProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

const RealCallOverlay = dynamic(
  () => import('./RealCallOverlay').then((m) => ({ default: m.RealCallOverlay })),
  { ssr: false, loading: () => null }
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', animation: 'callRing 1.6s ease-out infinite' }} />
        <Avatar name={call.fromHandle} size="lg" />
      </div>
      <div style={{ fontSize: '1.5em', fontWeight: 700 }}>@{call.fromHandle}</div>
      <div style={{ opacity: 0.6, marginTop: 6 }}>{call.video ? 'Incoming video call' : 'Incoming voice call'}</div>

      <div style={{ display: 'flex', gap: 48, marginTop: 72 }}>
        <button onClick={decline} aria-label="Decline" style={{ width: 72, height: 72, borderRadius: 36, background: '#b3261e', color: '#fff', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}><Icon name="phone" size={28} /></span>
        </button>
        <button onClick={accept} aria-label="Accept" style={{ width: 72, height: 72, borderRadius: 36, background: '#0a7a3d', color: '#fff', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icon name="phone" size={28} />
        </button>
      </div>

      <style>{`
        @keyframes callRing {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
