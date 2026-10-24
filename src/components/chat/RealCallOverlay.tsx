'use client';
import { useEffect, useState } from 'react';
import { LiveKitRoom, useTracks, VideoTrack, AudioTrack, useParticipants, RoomAudioRenderer } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useSocket } from '@/components/chat/SocketProvider';
import { Icon } from '@/components/ui/Icon';

function CustomCallUI({ onEnd }: { onEnd: () => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const participants = useParticipants();
  
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal && t.source === Track.Source.Camera);
  const remoteTrack = remoteTracks.find(t => t.source === Track.Source.Camera);

  const isVideo = !!remoteTrack || !!localTrack;
  const isGroup = participants.length > 2;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '.9em', opacity: 0.8 }}>
          {isGroup ? 'Group Call' : 'Call'} · {participants.length} participant(s)
        </div>
        <button onClick={onEnd} style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer' }}>
          <Icon name="x" size={24} />
        </button>
      </div>

      {/* Video Area */}
      <div style={{ flex: 1, position: 'relative', display: 'grid', placeItems: 'center', padding: 20 }}>
        {isVideo && remoteTrack ? (
          <VideoTrack trackRef={remoteTrack} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: 60, background: '#222', margin: '0 auto 20px', display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 'bold' }}>
              {participants[0]?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <h2>{participants[0]?.name || 'Connected'}</h2>
            <p className="muted">Voice Call</p>
          </div>
        )}

        {/* PiP (Local Video) */}
        {isVideo && localTrack && (
          <div style={{ position: 'absolute', top: 20, right: 20, width: 120, height: 160, borderRadius: 16, overflow: 'hidden', border: '2px solid #333' }}>
            <VideoTrack trackRef={localTrack} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '30px 20px', display: 'flex', justifyContent: 'center', gap: 20 }}>
        <button onClick={onEnd} style={{ width: 64, height: 64, borderRadius: 32, background: '#ff3b30', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
          <Icon name="phone" size={28} style={{ transform: 'rotate(135deg)' }} />
        </button>
      </div>
      <RoomAudioRenderer />
    </div>
  );
}

export function RealCallOverlay({
  handle, roomName, video, onClose,
}: { handle: string; roomName?: string; video?: boolean; onClose: () => void }) {
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

  function end() {
    if (socket) socket.emit('call-end', { roomName: room });
    onClose();
  }

  if (error) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: '#fff', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ marginBottom: 12 }}>Call Failed</h2>
        <p style={{ opacity: .8, marginBottom: 20 }}>{error}</p>
        <button onClick={end} className="btn o" style={{ color: '#fff', borderColor: '#fff' }}>Close</button>
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
        <CustomCallUI onEnd={end} />
      </LiveKitRoom>
    </div>
  );
}
