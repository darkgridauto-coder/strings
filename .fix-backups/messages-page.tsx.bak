'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useUser } from '@/components/UserProvider';
import { useSheet } from '@/components/ui/Sheet';
import { NewMessageSheet } from '@/components/chat/NewMessageSheet';

type Participant = { id: string; handle: string; displayName: string; avatar?: string | null };
type LastMsg = { body: string; createdAt: string; senderId: string; mediaKind?: string | null } | null;
type Conv = {
  id: string;
  participants: Participant[];
  lastMessage?: LastMsg;
  unreadCount?: number;
  isGroup?: boolean;
  groupName?: string;
  isPinned?: boolean;
  isRequest?: boolean;
};

type Call = {
  id: string;
  peer: { handle: string; displayName: string; avatar?: string | null };
  video: boolean;
  direction: 'incoming' | 'outgoing';
  status: string;
  createdAt: string;
};

type Tab = 'chats' | 'requests' | 'calls';
type Filter = 'all' | 'unread';

export default function MessagesPage() {
  const { user } = useUser();
  const { openSheet } = useSheet();
  const [tab, setTab] = useState<Tab>('chats');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [requests, setRequests] = useState<Conv[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/conversations/list').then(r => r.ok ? r.json() : { ok: false }).catch(() => ({ ok: false })),
      fetch('/api/conversations/requests').then(r => r.ok ? r.json() : { ok: false }).catch(() => ({ ok: false })),
      fetch('/api/calls/history').then(r => r.ok ? r.json() : { ok: false }).catch(() => ({ ok: false })),
    ]).then(([listRes, reqRes, callsRes]) => {
      if (listRes.ok) setConversations(listRes.conversations || []);
      if (reqRes.ok) setRequests(reqRes.requests || []);
      if (callsRes.ok) setCalls(callsRes.calls || []);
    }).finally(() => setLoading(false));
  }, []);

  const getOther = (c: Conv): Participant => {
    if (c.isGroup) return { id: c.id, handle: '', displayName: c.groupName || 'Group', avatar: null };
    return c.participants?.find(p => p.id !== user?.id) || { id: 'unknown', handle: 'unknown', displayName: 'Unknown', avatar: null };
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPreview = (c: Conv) => {
    if (c.isRequest) return 'Message request';
    const m = c.lastMessage;
    if (!m) return 'No messages yet';
    const prefix = m.senderId === user?.id ? 'You: ' : '';
    if (m.mediaKind === 'image') return prefix + '📷 Photo';
    if (m.mediaKind === 'file') return prefix + '📎 File';
    if (m.mediaKind === 'voice') return prefix + '🎤 Voice note';
    return prefix + (m.body || '').slice(0, 40);
  };

  const filteredChats = conversations.filter(c => {
    if (query) {
      const q = query.toLowerCase();
      const other = getOther(c);
      const nameMatch = other.displayName.toLowerCase().includes(q) || other.handle.toLowerCase().includes(q);
      const msgMatch = c.lastMessage?.body.toLowerCase().includes(q);
      if (!nameMatch && !msgMatch) return false;
    }
    if (filter === 'unread' && !(c.unreadCount && c.unreadCount > 0)) return false;
    return true;
  }).sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tb - ta;
  });

  const renderChatRow = (c: Conv) => {
    const other = getOther(c);
    return (
      <Link key={c.id} href={`/app/messages/${other.handle}`} className="row" style={{ borderBottom: '1px solid var(--ln)', borderRadius: 0, padding: '12px 16px' }}>
        <Avatar name={other.displayName} src={other.avatar || undefined} />
        <div className="m" style={{ minWidth: 0 }}>
          <div className="row-title" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: (c.unreadCount || 0) > 0 ? 700 : 600 }}>
            {c.isPinned && <Icon name="pin" size={14} />}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{other.displayName}</span>
            {c.isGroup && <span className="badge" style={{ fontSize: '.7em', padding: '1px 5px' }}>{c.participants.length}</span>}
          </div>
          <div className="row-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: (c.unreadCount || 0) > 0 ? 'var(--tx)' : 'var(--t2)' }}>
            {getPreview(c)}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <small className="muted" style={{ fontSize: '.75em' }}>{formatTime(c.lastMessage?.createdAt)}</small>
          {(c.unreadCount || 0) > 0 && <div className="dot" />}
        </div>
      </Link>
    );
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <header className="topbar">
        <h1 className="left">Messages</h1>
        <div style={{ flex: 1 }} />
        <div className="topbar-actions">
          <button className="ib" aria-label="New message" onClick={() => openSheet(<NewMessageSheet />)}>
            <Icon name="edit" />
          </button>
        </div>
      </header>

      <div className="seg" style={{ margin: '12px 16px', padding: 4, background: 'var(--b2)', borderRadius: 16 }}>
        {(['chats', 'requests', 'calls'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: '.9em',
              whiteSpace: 'nowrap',
              fontWeight: tab === t ? 700 : 500,
              background: tab === t ? 'var(--tx)' : 'transparent',
              color: tab === t ? 'var(--bg)' : 'var(--t2)',
              border: 0,
              cursor: 'pointer',
              transition: 'background .2s, color .2s',
            }}
          >
            {t} {t === 'requests' && requests.length > 0 ? `(${requests.length})` : ''}
          </button>
        ))}
      </div>

      {loading && <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Loading…</p>}

      {!loading && tab === 'chats' && (
        <div>
          <div style={{ padding: '0 16px 12px' }}>
            <label className="fl" style={{ margin: 0, background: 'var(--b2)' }}>
              <span style={{ display: 'none' }}>Search</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="search" size={18} style={{ color: 'var(--t2)' }} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations" style={{ background: 'none' }} />
              </div>
            </label>
          </div>

          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
            <button className={`pill ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`pill ${filter === 'unread' ? 'on' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
          </div>

          {filteredChats.length === 0 ? (
            <div className="empty">
              <Icon name="chat" />
              <b>No conversations</b>
              {filter === 'unread' ? 'You are all caught up.' : 'Start a new chat to see it here.'}
            </div>
          ) : (
            filteredChats.map(renderChatRow)
          )}
        </div>
      )}

      {!loading && tab === 'requests' && (
        <div>
          <p className="note" style={{ padding: '0 16px 12px' }}>People you do not follow can message you here. Nothing continues until you accept.</p>
          {requests.length === 0 ? (
            <div className="empty">
              <Icon name="shield" />
              <b>No message requests</b>
              Requests from people you don't follow will appear here.
            </div>
          ) : (
            requests.map(r => {
              const other = getOther(r);
              return (
                <div key={r.id} className="row" style={{ borderBottom: '1px solid var(--ln)', borderRadius: 0, padding: '12px 16px', cursor: 'default' }}>
                  <Avatar name={other.displayName} src={other.avatar || undefined} />
                  <div className="m">
                    <div className="row-title">{other.displayName}</div>
                    <div className="row-sub">{getPreview(r)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="pill sm" style={{ background: 'var(--b3)' }} onClick={async () => {
                        const res = await fetch(`/api/conversations/requests/${r.id}/decline`, { method: 'POST' });
                        if (res.ok) { window.location.reload(); }
                      }}>Decline</button>
                    <button className="pill sm on" onClick={async () => {
                        const res = await fetch(`/api/conversations/requests/${r.id}/accept`, { method: 'POST' });
                        if (res.ok) { window.location.reload(); }
                      }}>Accept</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!loading && tab === 'calls' && (
        <div>
          <p className="note" style={{ padding: '0 16px 12px' }}>Recent calls</p>
          {calls.length === 0 ? (
            <div className="empty">
              <Icon name="phone" />
              <b>No recent calls</b>
              Calls you make or miss will appear here.
            </div>
          ) : (
            calls.map(c => {
              const missed = c.direction === 'incoming' && c.status !== 'answered';
              return (
                <div key={c.id} className="row" style={{ borderBottom: '1px solid var(--ln)', borderRadius: 0, padding: '12px 16px' }}>
                  <Avatar name={c.peer.displayName} src={c.peer.avatar || undefined} />
                  <div className="m">
                    <div className="row-title" style={{ fontWeight: missed ? 800 : 600 }}>{c.peer.displayName}</div>
                    <div className="row-sub" style={{ color: missed ? 'var(--bad)' : 'var(--t2)' }}>
                      {missed ? 'Missed' : c.direction === 'incoming' ? 'Incoming' : 'Outgoing'} · {c.video ? 'Video' : 'Voice'} · {formatTime(c.createdAt)}
                    </div>
                  </div>
                  <button className="ib" aria-label="Call back">
                    <Icon name={c.video ? 'video' : 'phone'} size={20} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
