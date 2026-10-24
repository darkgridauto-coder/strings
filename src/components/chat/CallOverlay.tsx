'use client';
import { useState, useEffect } from 'react';
import { useCall } from '@/components/chat/CallProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';

function fmtDur(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function CallOverlay() {
  const { call, acceptCall, declineCall, endCall, toggleMute, toggleCamera, toggleSpeaker, addParticipant } = useCall();
  const [addOpen, setAddOpen] = useState(false);
  const [addHandle, setAddHandle] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (call?.state === 'connected') {
      const timer = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [call?.state]);

  if (!call) return null;

  const isIncoming = call.state === 'incoming';
  const isRinging = call.state === 'ringing';
  const isConnected = call.state === 'connected';
  const dur = call.startedAt ? fmtDur(Date.now() - call.startedAt) : '';

  // If there are multiple participants, show a grid
  const isGroup = call.participants.length > 1;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Bar */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85em', opacity: 0.7 }}>
          {call.video ? 'Video call' : 'Voice call'} {isConnected && ` · ${dur}`} {isRinging && ' · Ringing…'}
        </div>
        <button onClick={endCall} aria-label="Close" style={{ background: 'transparent', color: '#fff', border: 0 }}>
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 20px', position: 'relative' }}>
        
        {call.video && isConnected ? (
          <div style={{ width: '100%', height: '100%', borderRadius: 24, background: '#222', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 8, padding: 16 }}>
            {/* Demo Video Grid */}
            {call.participants.map((p, i) => (
              <div key={i} style={{ width: isGroup ? '45%' : '100%', height: isGroup ? '45%' : '80%', background: '#111', borderRadius: 16, display: 'grid', placeItems: 'center', border: '1px solid #333' }}>
                <div style={{ textAlign: 'center', opacity: 0.6 }}>
                  <Avatar name={p.displayName} size="lg" />
                  <p style={{ marginTop: 8, fontSize: '.85em' }}>{p.displayName}</p>
                </div>
              </div>
            ))}
            {call.cameraOn && (
              <div style={{ position: 'absolute', bottom: 20, right: 20, width: 120, height: 160, borderRadius: 16, background: '#333', border: '2px solid #fff', display: 'grid', placeItems: 'center' }}>
                <small>You (Demo)</small>
              </div>
            )}
          </div>
        ) : (
          <>
            <Avatar name={call.peerName} src={call.peerAvatar || undefined} size="lg" />
            <h2 style={{ margin: 0, fontSize: '1.6em' }}>{call.peerName}</h2>
            <p style={{ opacity: 0.6, margin: 0 }}>
              {isIncoming ? 'Incoming call' : isRinging ? 'Ringing…' : 'Connected'}
            </p>
            {isGroup && <p style={{ opacity: 0.5, fontSize: '.85em' }}>{call.participants.length} participants</p>}
          </>
        )}

        {/* Add Participant Input */}
        {addOpen && isConnected && (
          <div style={{ position: 'absolute', top: '20%', background: '#111', borderRadius: 16, padding: 20, width: '90%', maxWidth: 320, zIndex: 10 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '.8em', opacity: 0.7 }}>Invite to call</label>
            <input
              value={addHandle}
              onChange={e => setAddHandle(e.target.value.replace(/^@/, ''))}
              placeholder="@handle"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#222', border: '1px solid #333', color: '#fff', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 10, background: '#222', color: '#fff', border: 0 }}>Cancel</button>
              <button onClick={() => { if (addHandle) { addParticipant(addHandle); setAddHandle(''); setAddOpen(false); } }} style={{ flex: 1, padding: 10, borderRadius: 10, background: '#fff', color: '#000', border: 0, fontWeight: 600 }}>Invite</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isIncoming ? (
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px 40px 40px' }}>
          <button onClick={declineCall} style={{ width: 64, height: 64, borderRadius: 32, background: '#b3261e', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
            <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}><Icon name="phone" size={26} /></span>
          </button>
          <button onClick={acceptCall} style={{ width: 64, height: 64, borderRadius: 32, background: '#0a7a3d', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name="phone" size={26} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '20px 20px 40px', gap: 8 }}>
          <button onClick={toggleMute} style={{ width: 56, height: 56, borderRadius: 28, background: call.muted ? '#fff' : '#ffffff22', color: call.muted ? '#000' : '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name={call.muted ? 'mic_off' : 'mic'} size={22} />
          </button>
          <button onClick={toggleSpeaker} style={{ width: 56, height: 56, borderRadius: 28, background: call.speakerOn ? '#fff' : '#ffffff22', color: call.speakerOn ? '#000' : '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name="spk" size={22} />
          </button>
          
          {/* Toggle Audio/Video */}
          <button onClick={toggleCamera} style={{ width: 56, height: 56, borderRadius: 28, background: call.cameraOn ? '#fff' : '#ffffff22', color: call.cameraOn ? '#000' : '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name={call.cameraOn ? 'video' : 'videooff'} size={22} />
          </button>

          {/* Add Participant */}
          {isConnected && (
            <button onClick={() => setAddOpen(true)} style={{ width: 56, height: 56, borderRadius: 28, background: '#ffffff22', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
              <Icon name="plus" size={22} />
            </button>
          )}

          <button onClick={endCall} style={{ width: 56, height: 56, borderRadius: 28, background: '#b3261e', color: '#fff', border: 0, display: 'grid', placeItems: 'center' }}>
            <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}><Icon name="phone" size={22} /></span>
          </button>
        </div>
      )}
    </div>
  );
}
