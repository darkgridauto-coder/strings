'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Icon } from '@/components/ui/Icon';
import { ConversationView } from '@/components/chat/ConversationView';
import { useSocket } from '@/components/chat/SocketProvider';
import { useUser } from '@/components/UserProvider';

const RealCallOverlay = dynamic(
  () => import('@/components/chat/RealCallOverlay').then((m) => m.RealCallOverlay),
  { ssr: false, loading: () => null }
);

export default function Page({ params }: { params: { id: string } }) {
  const socket = useSocket();
  const { user } = useUser();
  const [group, setGroup] = useState<any>(null);
  const [call, setCall] = useState<{ video: boolean; roomName: string } | null>(null);

  useEffect(() => {
    fetch(`/api/groups/${params.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setGroup(d.conversation); });
  }, [params.id]);

  function startGroupCall(video: boolean) {
    if (!socket || !user) return;
    const roomName = `group-${params.id}`;
    // notify members via socket (best-effort)
    group?.participants?.forEach((p: any) => {
      if (p.id !== user.id) socket.emit('call-user', { to: p.id, from: user.id, fromHandle: user.handle, roomName, video });
    });
    setCall({ video, roomName });
  }

  return (
    <>
      <header className="topbar">
        <Link href="/app/messages" className="ib" aria-label="Back"><Icon name="back" /></Link>
        <h1>{group?.groupName || 'Group'}</h1>
        <div className="topbar-actions">
          <button className="ib" onClick={() => startGroupCall(false)} aria-label="Voice call"><Icon name="phone" /></button>
          <button className="ib" onClick={() => startGroupCall(true)} aria-label="Video call"><Icon name="video" /></button>
          <Link className="ib" href={`/app/groups/${params.id}/settings`} aria-label="Group settings">⋯</Link>
        </div>
      </header>
      <ConversationView conversationId={params.id} peerHandle={group?.groupName || 'group'} />
      {call && (
        <RealCallOverlay
          handle="group"
          roomName={call.roomName}
          video={call.video}
          onClose={() => setCall(null)}
        />
      )}
    </>
  );
}
