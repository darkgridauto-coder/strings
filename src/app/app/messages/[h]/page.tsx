'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ConversationView } from '@/components/chat/ConversationView';
import { RealCallOverlay } from '@/components/chat/RealCallOverlay';
import { useSocket } from '@/components/chat/SocketProvider';
import { useUser } from '@/components/UserProvider';

type Peer = { id: string; handle: string; displayName: string; avatar?: string | null };

export default function Page({ params }: { params: { h: string } }) {
  const router = useRouter();
  const socket = useSocket();
  const { user } = useUser();
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeCall, setActiveCall] = useState<{ video: boolean; roomName: string } | null>(null);

  // Deterministic room name — same on both sides
  const roomName = useMemo(() => {
    if (!user?.id || !peer?.id) return '';
    return `dm-${[user.id, peer.id].sort().join('-')}`;
  }, [user?.id, peer?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await fetch(`/api/users/${params.h}`).then(r => r.ok ? r.json() : { ok: false });
        if (cancelled) return;
        if (!u.ok) { setError(u.error || 'User not found'); return; }
        setPeer(u.user);

        const c = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: params.h }),
        }).then(r => r.ok ? r.json() : { ok: false });
        if (cancelled) return;
        if (!c.ok) { setError(c.error || 'Could not open conversation'); return; }
        setConversationId(c.conversation.id);
      } catch {
        if (!cancelled) setError('Network error');
      }
    })();
    return () => { cancelled = true; };
  }, [params.h]);

  function startCall(video: boolean) {
    if (!socket || !user || !peer || !roomName) {
      setError('Calling not ready. Socket not connected.');
      return;
    }
    socket.emit('call-user', {
      to: peer.id,
      from: user.id,
      fromHandle: user.handle,
      roomName,
      video,
    });
    setActiveCall({ video, roomName });
  }

  if (error) {
    return (
      <div className="page" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontWeight: 600 }}>{error}</p>
        <button className="pill" onClick={() => router.back()} style={{ marginTop: 16 }}>Back</button>
      </div>
    );
  }

  if (!conversationId || !peer) {
    return (
      <div className="page" style={{ padding: 40, textAlign: 'center' }}>
        <p className="muted">Opening…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ln)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link href="/app/messages" aria-label="Back" style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 18 }}>
          <Icon name="back" size={20} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ display: 'block', fontSize: '.95em' }}>{peer.displayName}</b>
          <small className="muted" style={{ fontSize: '.8em' }}>@{peer.handle}</small>
        </div>
        <button className="ib" onClick={() => startCall(false)} aria-label="Voice call">
          <Icon name="phone" size={20} />
        </button>
        <button className="ib" onClick={() => startCall(true)} aria-label="Video call">
          <Icon name="video" size={20} />
        </button>
        <Link href={`/app/messages/${peer.handle}/settings`} className="ib" aria-label="Settings">
          <Icon name="more" size={20} />
        </Link>
      </div>
      <ConversationView conversationId={conversationId} peerHandle={peer.handle} peer={peer} />
      {activeCall && (
        <RealCallOverlay
          handle={peer.handle}
          roomName={activeCall.roomName}
          video={activeCall.video}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
