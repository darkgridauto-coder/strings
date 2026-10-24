'use client';
import { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useConnectionState,
  useRoomContext,
  VideoTrack,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState } from 'livekit-client';
import { useSocket } from '@/components/chat/SocketProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

export function RealCallOverlay({
  handle, roomName, video, onClose,
}: { handle: string; roomName?: string; video?: boolean; onClose: () => void }) {
  const socket = useSocket();
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const room = roomName || `dm-${handle}`;

  useEffect(() => {
    fetch('/api/calls/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      if (rn === room) { setError('Call declined'); setTimeout(onClose, 900); }
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

  if (error) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0a0a0a', color: '#fff', display: 'grid', placeItems: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '1.4em', fontWeight: 700, marginBottom: 12 }}>
            {error.toLowerCase().includes('declined') ? 'Call declined' : 'Call unavailable'}
          </div>
          {!error.toLowerCase().includes('declined') && (
            <p style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.5 }}>{error}</p>
          )}
          <button
            onClick={end}
            style={{ background: '#fff', color: '#000', border: 0, padding: '12px 24px', borderRadius: 24, fontWeight: 700, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!token || !url) {
    return <ConnectingScreen handle={handle} />;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0a0a0a' }}>
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect
        audio
        video={!!video}
        onDisconnected={end}
        style={{ height: '100dvh', width: '100%' }}
      >
        <CallStage handle={handle} startVideo={!!video} onLeave={end} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function ConnectingScreen({ handle }: { handle: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', animation: 'callPulse 1.6s ease-out infinite' }} />
        <Avatar name={handle} size="lg" />
      </div>
      <div style={{ fontSize: '1.3em', fontWeight: 700 }}>{handle}</div>
      <div style={{ opacity: 0.6, fontSize: '.9em' }}>Connecting…</div>
      <style>{`
        @keyframes callPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CallStage({ handle, startVideo, onLeave }: { handle: string; startVideo: boolean; onLeave: () => void }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(startVideo);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    const started = Date.now();
    const t = setInterval(() => setDuration(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [connectionState]);

  useEffect(() => {
    document.body.setAttribute('data-immersive', 'true');
    return () => document.body.removeAttribute('data-immersive');
  }, []);

  const remoteVideoTracks = tracks.filter((t) => t.source === Track.Source.Camera && !t.participant.isLocal);
  const localVideoTrack = tracks.find((t) => t.source === Track.Source.Camera && t.participant.isLocal);
  const remoteParticipants = Array.from(room.remoteParticipants.values());
  const isGroup = remoteParticipants.length > 1;
  const peerName = remoteParticipants[0]?.name || remoteParticipants[0]?.identity || handle;
  const hasRemoteVideo = remoteVideoTracks.length > 0;

  async function toggleMute() {
    try { await localParticipant.setMicrophoneEnabled(muted); setMuted(!muted); } catch {}
  }
  async function toggleCamera() {
    try { await localParticipant.setCameraEnabled(!cameraOn); setCameraOn(!cameraOn); } catch {}
  }
  function toggleSpeaker() { setSpeakerOn(!speakerOn); }
  function hangUp() { try { room.disconnect(); } catch {} onLeave(); }

  if (connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Reconnecting) {
    return <ConnectingScreen handle={peerName} />;
  }

  const isVideo = hasRemoteVideo || (cameraOn && !!localVideoTrack);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: isVideo ? '#000' : 'var(--bg)', color: isVideo ? '#fff' : 'var(--tx)' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {isVideo ? (
          isGroup ? (
            <GroupGrid tracks={remoteVideoTracks} localTrack={localVideoTrack} />
          ) : (
            <SingleVideo track={remoteVideoTracks[0]} localTrack={localVideoTrack} />
          )
        ) : (
          <VoiceCenter name={peerName} duration={duration} status={connectionState === ConnectionState.Connected ? 'Connected' : 'Calling…'} />
        )}
      </div>
      <ControlBar
        isVideo={isVideo}
        muted={muted}
        cameraOn={cameraOn}
        speakerOn={speakerOn}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleSpeaker={toggleSpeaker}
        onHangUp={hangUp}
        onMore={() => setShowMore(true)}
      />
      {showMore && (
        <MoreSheet
          handle={handle}
          room={room.name}
          onClose={() => setShowMore(false)}
        />
      )}
      <style>{`
        @keyframes callPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes callRing {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          100% { box-shadow: 0 0 0 40px rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
}

function SingleVideo({ track, localTrack }: { track: any; localTrack?: any }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
        {track ? (
          <VideoTrack trackRef={track} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#666' }}>Waiting for video…</div>
        )}
      </div>
      {localTrack && (
        <div style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', right: 12, width: 96, height: 128, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', background: '#111', zIndex: 2 }}>
          <VideoTrack trackRef={localTrack} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        </div>
      )}
    </>
  );
}

function GroupGrid({ tracks, localTrack }: { tracks: any[]; localTrack?: any }) {
  const all = [...tracks];
  if (localTrack) all.push(localTrack);
  const count = all.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: 4, background: '#000' }}>
      {all.map((t, i) => (
        <div key={i} style={{ position: 'relative', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
          <VideoTrack trackRef={t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 8, bottom: 6, fontSize: '.72em', opacity: 0.8, textShadow: '0 1px 4px #000' }}>
            {t.participant.name || t.participant.identity || ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function VoiceCenter({ name, duration, status }: { name: string; duration: number; status: string }) {
  const mm = String(Math.floor(duration / 60)).padStart(2, '0');
  const ss = String(duration % 60).padStart(2, '0');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, color: 'var(--tx)' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid var(--b3)', animation: 'callPulse 1.8s ease-out infinite' }} />
        <Avatar name={name} size="lg" />
      </div>
      <div style={{ fontSize: '1.4em', fontWeight: 700 }}>{name}</div>
      <div style={{ opacity: 0.6, fontSize: '.95em' }}>
        {duration > 0 ? `${mm}:${ss}` : status}
      </div>
    </div>
  );
}

function ControlBar({
  isVideo, muted, cameraOn, speakerOn,
  onToggleMute, onToggleCamera, onToggleSpeaker, onHangUp, onMore,
}: {
  isVideo: boolean;
  muted: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onHangUp: () => void;
  onMore: () => void;
}) {
  const dark = isVideo;
  const circle = (on: boolean) => ({
    width: 56, height: 56, borderRadius: 28,
    background: on ? '#fff' : (dark ? 'rgba(255,255,255,0.14)' : 'var(--b2)'),
    color: on ? '#000' : (dark ? '#fff' : 'var(--tx)'),
    border: 0, display: 'grid' as const, placeItems: 'center' as const,
    cursor: 'pointer', transition: 'background .2s',
  });
  const btnBg = dark ? 'rgba(20,20,20,0.85)' : 'var(--bg)';
  return (
    <div style={{ padding: '12px 16px calc(20px + env(safe-area-inset-bottom))', background: dark ? 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))' : btnBg, display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={onToggleSpeaker} aria-label="Speaker" style={circle(!speakerOn)}>
        <Icon name="spk" size={22} />
      </button>
      <button onClick={onToggleCamera} aria-label="Camera" style={circle(!cameraOn)}>
        <Icon name={cameraOn ? 'video' : 'videooff'} size={22} />
      </button>
      <button onClick={onToggleMute} aria-label="Mute" style={circle(muted)}>
        <Icon name={muted ? 'mic_off' : 'mic'} size={22} />
      </button>
      <button onClick={onMore} aria-label="More" style={circle(false)}>
        <Icon name="more" size={22} />
      </button>
      <button onClick={onHangUp} aria-label="End call" style={{ width: 64, height: 64, borderRadius: 32, background: '#b3261e', color: '#fff', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>
          <Icon name="phone" size={26} />
        </span>
      </button>
    </div>
  );
}

function MoreSheet({ handle, room, onClose }: { handle: string; room: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 101, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', color: 'var(--tx)', borderRadius: 20, padding: 20, maxWidth: 380, width: '100%' }}>
        <div style={{ fontSize: '1.1em', fontWeight: 700, marginBottom: 8 }}>Call details</div>
        <div style={{ fontSize: '.9em', color: 'var(--t2)', marginBottom: 4 }}>Peer: @{handle}</div>
        <div style={{ fontSize: '.9em', color: 'var(--t2)', wordBreak: 'break-all', marginBottom: 16 }}>Room: {room}</div>
        <button onClick={onClose} style={{ width: '100%', padding: 12, borderRadius: 14, background: 'var(--b2)', border: 0, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}
