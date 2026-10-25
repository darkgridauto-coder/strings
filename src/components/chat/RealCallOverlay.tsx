'use client';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useSocket } from '@/components/chat/SocketProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

function fmt(s: number) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

function CustomCallUI({
  video, peerName, peerAvatar, roomName, onEnd,
}: {
  video: boolean;
  peerName: string;
  peerAvatar?: string | null;
  roomName: string;
  onEnd: () => void;
}) {
  const socket = useSocket();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera]);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(video);
  const [outputMuted, setOutputMuted] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteHandle, setInviteHandle] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!localParticipant) return;
    setMuted(localParticipant.isMicrophoneEnabled === false);
    setCameraOn(localParticipant.isCameraEnabled === true);
  }, [localParticipant]);

  async function toggleMute() {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
    setMuted(!localParticipant.isMicrophoneEnabled);
  }
  async function toggleCamera() {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
    setCameraOn(localParticipant.isCameraEnabled);
  }
  function invite() {
    if (!inviteHandle.trim() || !socket) return;
    socket.emit('call-add-participant', { roomName, invite: inviteHandle.trim().replace(/^@/, '') });
    setInviteHandle('');
    setInviteOpen(false);
  }

  const remoteTracks = tracks.filter((t) => !t.participant.isLocal && t.source === Track.Source.Camera);
  const localTrack = tracks.find((t) => t.participant.isLocal && t.source === Track.Source.Camera);
  const isGroup = participants.length > 2;
  const showVideo = video && cameraOn && (remoteTracks.length > 0 || localTrack);

  const controls = (
    <div style={{ padding: '20px 20px 40px', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        style={{
          width: 56, height: 56, borderRadius: 28, border: 0, cursor: 'pointer',
          background: muted ? '#fff' : 'rgba(255,255,255,.15)',
          color: muted ? '#000' : '#fff',
          display: 'grid', placeItems: 'center',
        }}
      >
        <Icon name={muted ? 'mic_off' : 'mic'} size={22} />
      </button>
      <button
        onClick={toggleCamera}
        aria-label={cameraOn ? 'Camera off' : 'Camera on'}
        style={{
          width: 56, height: 56, borderRadius: 28, border: 0, cursor: 'pointer',
          background: cameraOn ? '#fff' : 'rgba(255,255,255,.15)',
          color: cameraOn ? '#000' : '#fff',
          display: 'grid', placeItems: 'center',
        }}
      >
        <Icon name={cameraOn ? 'video' : 'videooff'} size={22} />
      </button>
      <button
        onClick={() => setOutputMuted((v) => !v)}
        aria-label={outputMuted ? 'Unmute audio' : 'Mute audio'}
        style={{
          width: 56, height: 56, borderRadius: 28, border: 0, cursor: 'pointer',
          background: outputMuted ? '#fff' : 'rgba(255,255,255,.15)',
          color: outputMuted ? '#000' : '#fff',
          display: 'grid', placeItems: 'center',
        }}
      >
        <Icon name="spk" size={22} />
      </button>
      {isGroup && (
        <button
          onClick={() => setInviteOpen(true)}
          aria-label="Add participant"
          style={{
            width: 56, height: 56, borderRadius: 28, border: 0, cursor: 'pointer',
            background: 'rgba(255,255,255,.15)', color: '#fff',
            display: 'grid', placeItems: 'center',
          }}
        >
          <Icon name="plus" size={22} />
        </button>
      )}
      <button
        onClick={onEnd}
        aria-label="End call"
        style={{
          width: 64, height: 64, borderRadius: 32, border: 0, cursor: 'pointer',
          background: '#b3261e', color: '#fff', display: 'grid', placeItems: 'center',
        }}
      >
        <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>
          <Icon name="phone" size={26} />
        </span>
      </button>
    </div>
  );

  const inviteSheet = inviteOpen && (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', padding: 24 }}
      onClick={() => setInviteOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#111', borderRadius: 20, padding: 20, maxWidth: 360, width: '100%', color: '#fff' }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Invite to call</h3>
        <input
          autoFocus
          value={inviteHandle}
          onChange={(e) => setInviteHandle(e.target.value)}
          placeholder="@handle"
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#222', border: '1px solid #333', color: '#fff', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setInviteOpen(false)}
            style={{ flex: 1, padding: 10, borderRadius: 10, background: '#222', color: '#fff', border: 0, cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={invite}
            style={{ flex: 1, padding: 10, borderRadius: 10, background: '#fff', color: '#000', border: 0, cursor: 'pointer', fontWeight: 600 }}
          >Invite</button>
        </div>
      </div>
    </div>
  );

  const audioRenderer = !outputMuted && <RoomAudioRenderer />;

  if (isGroup && showVideo) {
    const cols = participants.length <= 4 ? 2 : 3;
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '.85em', opacity: 0.8 }}>Group call · {fmt(elapsed)}</div>
          <button onClick={onEnd} style={{ background: 'transparent', color: '#fff', border: 0, cursor: 'pointer' }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', 1fr)', gap: 8, padding: 16 }}>
          {tracks.filter((t) => t.source === Track.Source.Camera).map((t, i) => (
            <div key={t.participant.identity + '-' + i} style={{ background: '#111', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <VideoTrack trackRef={t} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '.8em', background: 'rgba(0,0,0,.55)', padding: '2px 8px', borderRadius: 8 }}>
                {t.participant.name || t.participant.identity}
              </div>
            </div>
          ))}
        </div>
        {controls}
        {inviteSheet}
        {audioRenderer}
      </div>
    );
  }

  if (showVideo) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '.85em', opacity: 0.8 }}>Video call · {fmt(elapsed)}</div>
          <button onClick={onEnd} style={{ background: 'transparent', color: '#fff', border: 0, cursor: 'pointer' }}>
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {remoteTracks[0] && (
            <VideoTrack trackRef={remoteTracks[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {localTrack && (
            <div style={{ position: 'absolute', top: 20, right: 20, width: 120, height: 160, borderRadius: 16, overflow: 'hidden', border: '2px solid #fff' }}>
              <VideoTrack trackRef={localTrack} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
        {controls}
        {inviteSheet}
        {audioRenderer}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '.85em', opacity: 0.8 }}>{isGroup ? 'Group call' : 'Voice call'} · {fmt(elapsed)}</div>
        <button onClick={onEnd} style={{ background: 'transparent', color: '#fff', border: 0, cursor: 'pointer' }}>
          <Icon name="x" size={20} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Avatar name={peerName} src={peerAvatar || undefined} size="lg" />
        <h2 style={{ margin: 0, fontSize: '1.6em' }}>{peerName}</h2>
        <p style={{ opacity: 0.6, margin: 0 }}>
          {isGroup ? participants.length + ' participants' : 'Connected'}
        </p>
      </div>
      {controls}
      {inviteSheet}
      {audioRenderer}
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

  function end() {
    if (socket) socket.emit('call-end', { roomName: room });
    onClose();
  }

  if (error) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: '#fff', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ marginBottom: 12 }}>Call Failed</h2>
        <p style={{ opacity: 0.8, marginBottom: 20 }}>{error}</p>
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
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect
        audio
        video={!!video}
        onDisconnected={end}
        style={{ height: '100dvh' }}
      >
        <CustomCallUI
          video={!!video}
          peerName={handle}
          peerAvatar={null}
          roomName={room}
          onEnd={end}
        />
      </LiveKitRoom>
    </div>
  );
}
