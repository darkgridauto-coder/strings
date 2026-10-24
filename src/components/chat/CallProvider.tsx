'use client';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/components/chat/SocketProvider';
import { useUser } from '@/components/UserProvider';
import { playIncomingRing, playCallEnded } from '@/lib/notificationSound';

export type CallState = 'idle' | 'ringing' | 'incoming' | 'connecting' | 'connected' | 'ended';

export type Call = {
  id: string;
  peerHandle: string;
  peerName: string;
  peerAvatar?: string | null;
  video: boolean;
  state: CallState;
  muted: boolean;
  cameraOn: boolean;
  speakerOn: boolean;
  startedAt?: number;
  participants: { handle: string; displayName: string }[];
};

type CallCtx = {
  call: Call | null;
  startCall: (peer: { handle: string; name: string; avatar?: string | null }, video: boolean) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  addParticipant: (peerHandle: string) => void;
  incomingRing: boolean;
};

const Ctx = createContext<CallCtx>({} as CallCtx);
export const useCall = () => useContext(Ctx);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket();
  const { user } = useUser();
  const [call, setCall] = useState<Call | null>(null);
  const [incomingRing, setIncomingRing] = useState(false);
  const ringTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopRing() {
    if (ringTimer.current) { clearInterval(ringTimer.current); ringTimer.current = null; }
  }
  function startRing() {
    stopRing();
    try { playIncomingRing(); } catch {}
    ringTimer.current = setInterval(() => { try { playIncomingRing(); } catch {} }, 2500);
  }

  // Listen for incoming call
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('join-user', user.id);
    const onIncoming = (data: { fromHandle: string; fromName: string; fromAvatar?: string; video: boolean; roomName: string }) => {
      setCall({
        id: data.roomName, peerHandle: data.fromHandle, peerName: data.fromName, peerAvatar: data.fromAvatar,
        video: data.video, state: 'incoming', muted: false, cameraOn: data.video, speakerOn: true,
        participants: [{ handle: data.fromHandle, displayName: data.fromName }],
      });
      setIncomingRing(true);
      startRing();
    };
    const onAccepted = (data: { roomName: string }) => {
      setCall(c => c && c.id === data.roomName ? { ...c, state: 'connected', startedAt: Date.now() } : c);
      stopRing();
      setIncomingRing(false);
    };
    const onDeclined = () => { setCall(null); setIncomingRing(false); stopRing(); };
    const onEnded = () => { setCall(null); setIncomingRing(false); stopRing(); try { playCallEnded(); } catch {} };
    socket.on('incoming-call', onIncoming);
    socket.on('call-accepted', onAccepted);
    socket.on('call-declined', onDeclined);
    socket.on('call-ended', onEnded);
    socket.on('call-cancelled', onDeclined);
    return () => {
      socket.off('incoming-call', onIncoming);
      socket.off('call-accepted', onAccepted);
      socket.off('call-declined', onDeclined);
      socket.off('call-ended', onEnded);
      socket.off('call-cancelled', onDeclined);
    };
  }, [socket, user?.id]);

  // For outgoing calls, mock accept after 3s if demo (real backend would need peer to accept)
  useEffect(() => {
    if (call?.state === 'ringing') {
      startRing();
      // Simulate auto-connect for demo
      connectTimer.current = setTimeout(() => {
        setCall(c => c && c.state === 'ringing' ? { ...c, state: 'connected', startedAt: Date.now() } : c);
        stopRing();
      }, 3500);
    }
    return () => { if (connectTimer.current) { clearTimeout(connectTimer.current); connectTimer.current = null; } };
  }, [call?.state]);

  const startCall = useCallback((peer: { handle: string; name: string; avatar?: string | null }, video: boolean) => {
    if (!socket || !user) return;
    const roomName = `call-${user.id}-${peer.handle}-${Date.now()}`;
    setCall({
      id: roomName, peerHandle: peer.handle, peerName: peer.name, peerAvatar: peer.avatar,
      video, state: 'ringing', muted: false, cameraOn: video, speakerOn: true,
      participants: [{ handle: user.handle, displayName: user.displayName }],
    });
    socket.emit('call-user', {
      to: peer.handle, from: user.id, fromHandle: user.handle, roomName, video,
    });
  }, [socket, user]);

  const acceptCall = useCallback(() => {
    if (!socket || !call) return;
    setCall(c => c ? { ...c, state: 'connected', startedAt: Date.now() } : c);
    setIncomingRing(false);
    stopRing();
    socket.emit('call-response', { roomName: call.id, accepted: true });
  }, [socket, call]);

  const declineCall = useCallback(() => {
    if (!socket || !call) return;
    socket.emit('call-response', { roomName: call.id, accepted: false });
    setCall(null);
    setIncomingRing(false);
    stopRing();
  }, [socket, call]);

  const endCall = useCallback(() => {
    if (!socket || !call) return;
    socket.emit('call-end', { roomName: call.id });
    setCall(null);
    setIncomingRing(false);
    stopRing();
    try { playCallEnded(); } catch {}
  }, [socket, call]);

  const toggleMute = () => setCall(c => c ? { ...c, muted: !c.muted } : c);
  const toggleCamera = () => setCall(c => c ? { ...c, cameraOn: !c.cameraOn } : c);
  const toggleSpeaker = () => setCall(c => c ? { ...c, speakerOn: !c.speakerOn } : c);

  const addParticipant = useCallback((peerHandle: string) => {
    if (!socket || !call) return;
    socket.emit('call-add-participant', { roomName: call.id, invite: peerHandle });
    setCall(c => c ? { ...c, participants: [...c.participants, { handle: peerHandle, displayName: peerHandle }] } : c);
  }, [socket, call]);

  return (
    <Ctx.Provider value={{ call, startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera, toggleSpeaker, addParticipant, incomingRing }}>
      {children}
    </Ctx.Provider>
  );
}
