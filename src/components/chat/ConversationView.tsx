'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/components/chat/SocketProvider';
import { useUser } from '@/components/UserProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useSheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Row } from '@/components/ui/Row';
import { Bubble, ChatMessage } from './Bubble';
import { getWallpaper, wallpaperStyle } from '@/lib/chatWallpaper';
import { playMessagePing } from '@/lib/notificationSound';

type Participant = { id: string; handle: string; displayName: string; avatar?: string | null };

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '🙏', '🔥'];

export function ConversationView({
  conversationId,
  peerHandle,
  peer,
  readOnly = false,
  groupHeader,
}: {
  conversationId: string;
  peerHandle: string;
  peer?: Participant;
  readOnly?: boolean;
  groupHeader?: React.ReactNode;
}) {
  const socket = useSocket();
  const { user } = useUser();
  const { openSheet, closeSheet } = useSheet();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [typingPeers, setTypingPeers] = useState<Record<string, number>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [wallpaper, setWallpaper] = useState(() => getWallpaper(conversationId));

  const scroller = useRef<HTMLDivElement>(null);
  const sendLock = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingSentRef = useRef<number>(0);

  useEffect(() => {
    document.body.setAttribute('data-immersive', 'true');
    return () => { document.body.removeAttribute('data-immersive'); };
  }, []);

  useEffect(() => { setWallpaper(getWallpaper(conversationId)); }, [conversationId]);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m];
    });
  }, []);

  const scrollDown = () => {
    requestAnimationFrame(() => {
      if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
    });
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.isRequest) setIsPendingRequest(true);
      })
      .then((r) => r.ok ? r.json() : { ok: false })
      .then((d: any) => { if (d.ok) { setMessages(d.messages || []); scrollDown(); } else setError(d.error || 'Could not load'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join', conversationId);

    const onMessage = (m: ChatMessage) => {
      addMessage(m);
      scrollDown();
      // Someone typing a message cancels their typing indicator
      if (m.senderId) {
        setTypingPeers((prev) => { const next = { ...prev }; delete next[m.senderId]; return next; });
      }
      if (m.senderId !== user?.id) {
        try { playMessagePing(); } catch {}
        fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {});
      }
    };
    const onRead = (data: { convId: string; at: number }) => {
      if (data.convId !== conversationId) return;
      const iso = new Date(data.at).toISOString();
      setMessages((prev) => prev.map((m) => m.senderId === user?.id && !m.readAt ? { ...m, readAt: iso } : m));
    };
    const onTyping = (data: { handle: string }) => {
      if (!data.handle || data.handle === user?.handle) return;
      setTypingPeers((prev) => ({ ...prev, [data.handle]: Date.now() }));
    };
    const onReaction = (data: { msgId: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) => prev.map((m) => m.id === data.msgId ? { ...m, reactions: JSON.stringify(data.reactions) } : m));
    };

    socket.on('message', onMessage);
    socket.on('read-receipt', onRead);
    socket.on('typing', onTyping);
    socket.on('reaction', onReaction);

    return () => {
      socket.off('message', onMessage);
      socket.off('read-receipt', onRead);
      socket.off('typing', onTyping);
      socket.off('reaction', onReaction);
      socket.emit('leave', conversationId);
    };
  }, [socket, conversationId, user?.id, user?.handle, addMessage]);

  // Auto-clear typing indicators older than 3 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      setTypingPeers((prev) => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const [k, ts] of Object.entries(prev)) {
          if (now - ts < 3000) next[k] = ts;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  function notifyTyping() {
    if (!socket || !user) return;
    const now = Date.now();
    if (now - typingSentRef.current < 1500) return;
    typingSentRef.current = now;
    socket.emit('typing', { convId: conversationId, handle: user.handle });
  }

  async function postMessage(payload: Record<string, unknown>) {
    const r = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!d.ok) { setError(d.error || 'Send failed'); return false; }
    addMessage(d.message);
    scrollDown();
    return true;
  }

  async function send() {
    const body = text.trim();
    if (!body || sendLock.current) return;
    sendLock.current = true;
    setText('');
    setReplyingTo(null);
    try {
      const ok = await postMessage({ body, replyToId: replyingTo || undefined });
      if (!ok) setText(body);
    } finally { sendLock.current = false; }
  }

  async function sendFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError('File too large (15MB)'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upd = await up.json();
      if (!upd.ok) { setError(upd.error || 'Upload failed'); return; }
      const isImg = file.type.startsWith('image/');
      await postMessage({ body: file.name, mediaUrl: upd.url, mediaKind: isImg ? 'image' : 'file', replyToId: replyingTo || undefined });
      setReplyingTo(null);
    } catch { setError('Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { setError('Voice notes not supported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      recStartRef.current = Date.now();
      setRecording(true);
      setRecordTime(0);
      recTimerRef.current = setInterval(() => setRecordTime(Math.floor((Date.now() - recStartRef.current) / 1000)), 200);
    } catch { setError('Microphone unavailable'); }
  }

  function cancelRecording() {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    const mr = mrRef.current;
    if (mr) { mr.onstop = () => {}; mr.stop(); mr.stream.getTracks().forEach((t) => t.stop()); }
    setRecording(false); setRecordTime(0); mrRef.current = null;
  }

  async function stopAndSend() {
    const mr = mrRef.current;
    if (!mr) return;
    const duration = Math.max(1, Math.floor((Date.now() - recStartRef.current) / 1000));
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
      mr.stop();
      mr.stream.getTracks().forEach((t) => t.stop());
    });
    setRecording(false);
    const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
    try {
      const fd = new FormData();
      fd.append('file', new File([blob], `voice-${Date.now()}.webm`, { type: blob.type }));
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upd = await up.json();
      if (!upd.ok) { setError('Voice upload failed'); return; }
      await postMessage({ body: 'Voice note', mediaUrl: upd.url, mediaKind: 'voice', mediaDur: duration, replyToId: replyingTo || undefined });
      setReplyingTo(null);
    } catch { setError('Voice send failed'); }
    mrRef.current = null;
  }

  async function reactTo(msgId: string, emoji: string) {
    try {
      const r = await fetch(`/api/messages/${msgId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const d = await r.json();
      if (d.ok && d.reactions) {
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions: JSON.stringify(d.reactions) } : m));
      }
    } catch { showToast('Reaction failed'); }
  }

  async function copyMessage(msgId: string) {
    const m = messages.find((x) => x.id === msgId);
    if (!m) return;
    try { await navigator.clipboard.writeText(m.body || ''); showToast('Copied'); }
    catch { showToast('Could not copy'); }
  }

  function openActions(msgId: string) {
    const m = messages.find((x) => x.id === msgId);
    if (!m) return;
    openSheet(
      <div>
        <h3 style={{ marginTop: 0 }}>Message</h3>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 12, padding: '4px 2px' }}>
          {REACTION_EMOJIS.map((e) => (
            <button key={e} onClick={() => { reactTo(msgId, e); closeSheet(); }}
              style={{ fontSize: '1.5em', padding: 6, borderRadius: 12, background: 'transparent', border: '1px solid var(--ln)' }}>
              {e}
            </button>
          ))}
        </div>
        <Row icon="reply" title="Reply" onClick={() => { setReplyingTo(msgId); closeSheet(); inputRef.current?.focus(); }} />
        <Row icon="doc" title="Copy" onClick={() => { copyMessage(msgId); closeSheet(); }} />
        <button className="btn o" onClick={closeSheet} style={{ marginTop: 8 }}>Cancel</button>
      </div>
    );
  }

  function fmtDur(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  const wp = wallpaperStyle(wallpaper);
  const someoneTyping = Object.keys(typingPeers);
  const typingLabel = someoneTyping.length === 0 ? null
    : someoneTyping.length === 1 ? `${someoneTyping[0]} is typing…`
    : `${someoneTyping.length} people are typing…`;

  const replyTarget = replyingTo
    ? messages.find((m) => m.id === replyingTo) || null
    : null;

  
  if (isPendingRequest) {
    return (
      <div className="page" style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
        <h2>Message Request</h2>
        <p className="muted">@{peerHandle} wants to send you a message. Do you want to accept?</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn o" onClick={() => handleRequest('decline')}>Decline</button>
          <button className="btn" onClick={() => handleRequest('accept')}>Accept</button>
        </div>
      </div>
    );
  }

  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {groupHeader}
      <div ref={scroller} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', ...wp }}>
        {loading && <p className="muted" style={{ textAlign: 'center' }}>Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 30 }}>No messages yet. Say hello.</p>
        )}
        <div className="msgs">
          {messages.map((m) => {
            const parent = m.replyToId ? messages.find((x) => x.id === m.replyToId) : null;
            return (
              <Bubble
                key={m.id}
                m={m}
                mine={m.senderId === user?.id}
                currentUserId={user?.id}
                replyTo={parent ? { senderName: parent.senderId === user?.id ? 'You' : (peer?.displayName || peerHandle), preview: (parent.body || (parent.mediaKind ? `[${parent.mediaKind}]` : '')).slice(0, 80) } : null}
                onOpenActions={openActions}
              />
            );
          })}
        </div>
        {error && <p style={{ color: 'var(--tx)', fontWeight: 600, textAlign: 'center' }}>{error}</p>}
      </div>

      {typingLabel && (
        <div style={{ padding: '4px 16px', fontSize: '.78em', color: 'var(--t2)' }}>
          <span className="typing-dots"><i /><i /><i /></span> {typingLabel}
        </div>
      )}

      {readOnly ? null : recording ? (
        <div className="cmp">
          <span className="rec-dot" />
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 650 }}>{fmtDur(recordTime)}</span>
          <span style={{ flex: 1 }} />
          <button className="ib" onClick={cancelRecording} aria-label="Cancel"><Icon name="x" size={20} /></button>
          <button className="ib" style={{ background: 'var(--tx)', color: 'var(--bg)' }} onClick={stopAndSend} aria-label="Send voice"><Icon name="send" size={18} /></button>
        </div>
      ) : (
        <>
          {replyTarget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderTop: '1px solid var(--ln)', background: 'var(--bg)' }}>
              <div style={{ flex: 1, borderLeft: '3px solid var(--tx)', paddingLeft: 10 }}>
                <div style={{ fontSize: '.72em', color: 'var(--t2)', fontWeight: 600 }}>
                  Replying to {replyTarget.senderId === user?.id ? 'yourself' : (peer?.displayName || peerHandle)}
                </div>
                <div style={{ fontSize: '.85em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  {(replyTarget.body || (replyTarget.mediaKind ? `[${replyTarget.mediaKind}]` : '')).slice(0, 120)}
                </div>
              </div>
              <button className="ib" onClick={() => setReplyingTo(null)} aria-label="Cancel reply"><Icon name="x" size={16} /></button>
            </div>
          )}
          <div className="cmp">
            <input ref={fileRef} type="file" hidden onChange={sendFile} />
            <button className="ib" onClick={() => fileRef.current?.click()} aria-label="Attach file" disabled={uploading}>
              <Icon name="paperclip" size={20} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => { setText(e.target.value); notifyTyping(); }}
              placeholder={uploading ? 'Uploading…' : 'Write a message…'}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              disabled={uploading}
            />
            <button className="ib" onClick={startRecording} aria-label="Record voice"><Icon name="mic" size={20} /></button>
            <button className="ib" style={{ background: 'var(--tx)', color: 'var(--bg)' }} onClick={send} aria-label="Send" disabled={uploading}>
              <Icon name="send" size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
