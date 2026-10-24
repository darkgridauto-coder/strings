'use client';
import { useEffect, useState } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { useSocket } from '@/components/chat/SocketProvider';

export function RealCallOverlay({
  handle, roomName, video, onClose,
}: { handle: string; roomName?: string; video?: boolean; toUserId?: string; onClose: () => void }) {
  const socket = useSocket();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const room = roomName || ['dm', 'strings', handle].sort().join('-').replace(/[^a-z0-9-]/gi, '').toLowerCase();

  useEffect(() => {
    fetch('/api/calls/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName: room }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) { setToken(d.token); setUrl(d.url); }
        else setError(d.error || 'Could not get token');
      })
      .catch(() => setError('Network error'));
  }, [room]);

  useEffect(() => {
    if (!socket) return;
    const onDeclined = ({ roomName: rn }: { roomName: string }) => {
      if (rn === room) { setError('Call declined'); setTimeout(onClose, 800); }
    };
    const onEnded = ({ roomName: rn }: { roomName: string }) => {
      if (rn === room) onClose();
    };
    socket.on('call-declined', onDeclined);
    socket.on('call-cancelled', onDeclined);
    socket.on('call-ended', onEnded);
    return () => {
      socket.off('call-declined', onDeclined);
      socket.off('call-cancelled', onDeclined);
      socket.off('call-ended', onEnded);
    };
  }, [socket, room, onClose]);

  function end() {
    if (socket) socket.emit('call-end', { roomName: room });
    onClose();
  }

  if (error) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: '#fff', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ marginBottom: 12 }}>{error.includes('declined') ? 'Call declined' : 'Calling is not configured'}</h2>
        {!error.includes('declined') && <p style={{ opacity: .8, marginBottom: 20 }}>{error}</p>}
        <button onClick={() => { if (socket) socket.emit('call-end', { roomName: room }); onClose(); }} className="btn o" style={{ color: '#fff', borderColor: '#fff' }}>Close</button>
      </div>
    </div>
  );

  if (!token || !url) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: '#fff', display: 'grid', placeItems: 'center' }}>
      Connecting…
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }}>
      <LiveKitRoom token={token} serverUrl={url} connect audio video={!!video} onDisconnected={end} style={{ height: '100dvh' }}>
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
