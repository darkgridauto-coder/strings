'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/chat/SocketProvider';
import { useUser } from '@/components/UserProvider';
import { Icon } from '@/components/ui/Icon';
import { Bubble, ChatMessage } from './Bubble';
import { playMessagePing } from '@/lib/notificationSound';
import { getWallpaper, wallpaperStyle } from '@/lib/chatWallpaper';

export function ConversationView({
  conversationId, peerHandle, peer, readOnly = false, groupHeader,
}: {
  conversationId: string; peerHandle: string; peer?: any;
  readOnly?: boolean; groupHeader?: React.ReactNode;
}) {
  const router = useRouter();
  const socket = useSocket();
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [wallpaper, setWallpaperState] = useState(getWallpaper(conversationId));
  
  // Request Gating State
  const [isPendingRequest, setIsPendingRequest] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const sendLock = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-immersive', 'true');
    return () => { document.body.removeAttribute('data-immersive'); };
  }, []);

  useEffect(() => { setWallpaperState(getWallpaper(conversationId)); }, [conversationId]);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages(prev => {
      if (m.id && prev.some(x => x.id === m.id)) return prev;
      return [...prev, m];
    });
  }, []);

  function scrollDown() {
    requestAnimationFrame(() => {
      if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
    });
  }

  function load() {
    setLoading(true);
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.ok ? r.json() : { ok: false })
      .then((d: any) => {
        if (d.ok) {
          if (d.isRequest) setIsPendingRequest(true);
          setMessages(d.messages || []);
          scrollDown();
        } else setError(d.error || 'Could not load');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [conversationId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join', conversationId);
    const onMessage = (m: ChatMessage) => {
      addMessage(m); scrollDown();
      if (m.senderId !== user?.id) {
        try { playMessagePing(); } catch {}
        fetch(`/api/conversations/${conversationId}/read`, { method: 'POST' }).catch(() => {});
      }
    };
    const onRead = (data: { convId: string; at: number }) => {
      if (data.convId !== conversationId) return;
      const iso = new Date(data.at).toISOString();
      setMessages(prev => prev.map(m => m.senderId === user?.id && !m.readAt ? { ...m, readAt: iso } : m));
    };
    socket.on('message', onMessage);
    socket.on('read-receipt', onRead);
    return () => {
      socket.off('message', onMessage);
      socket.off('read-receipt', onRead);
      socket.emit('leave', conversationId);
    };
  }, [socket, conversationId, user?.id, addMessage]);

  async function handleRequest(action: 'accept' | 'decline') {
    try {
      const r = await fetch(`/api/conversations/requests/${conversationId}/${action}`, { method: 'POST' });
      if (r.ok) {
        if (action === 'accept') {
          setIsPendingRequest(false);
          load(); // reload messages to show the chat
        } else {
          router.push('/app/messages');
        }
      } else {
        const d = await r.json();
        setError(d.error || 'Failed to process request');
      }
    } catch {
      setError('Network error');
    }
  }

  async function send() {
    const body = text.trim();
    if (!body || sendLock.current) return;
    sendLock.current = true;
    setText('');
    try {
      const r = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Send failed'); setText(body); return; }
      addMessage(d.message); scrollDown();
    } catch { setError('Network error'); setText(body); }
    finally { sendLock.current = false; }
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
      const msg = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: file.name, mediaUrl: upd.url, mediaKind: isImg ? 'image' : 'file' }),
      });
      const md = await msg.json();
      if (md.ok) { addMessage(md.message); scrollDown(); }
    } catch { setError('Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { setError('Voice notes not supported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 
                       MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
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
    if (mr) { mr.onstop = () => {}; mr.stop(); mr.stream.getTracks().forEach(t => t.stop()); }
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
      mr.stream.getTracks().forEach(t => t.stop());
    });
    setRecording(false);
    const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
    try {
      const fd = new FormData();
      fd.append('file', new File([blob], `voice-${Date.now()}.webm`, { type: blob.type }));
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upd = await up.json();
      if (!upd.ok) { setError('Voice upload failed'); return; }
      const msg = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: 'Voice note', mediaUrl: upd.url, mediaKind: 'voice', mediaDur: duration }),
      });
      const md = await msg.json();
      if (md.ok) { addMessage(md.message); scrollDown(); }
    } catch { setError('Voice send failed'); }
    mrRef.current = null;
  }

  function fmtDur(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  // --- Request Gate UI ---
  if (isPendingRequest) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'var(--b2)', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
          <Icon name="shield" size={32} />
        </div>
        <h2 style={{ marginBottom: 8 }}>Message Request</h2>
        <p className="muted" style={{ maxWidth: 300, marginBottom: 24 }}>
          @{peerHandle} wants to send you a message. Accept to chat or decline to delete.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn o" onClick={() => handleRequest('decline')} style={{ padding: '10px 24px' }}>Decline</button>
          <button className="btn" onClick={() => handleRequest('accept')} style={{ padding: '10px 24px' }}>Accept</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {groupHeader}
      <div ref={scroller} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', ...wallpaperStyle(wallpaper) }}>
        {loading && <p className="muted" style={{ textAlign: 'center' }}>Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="muted" style={{ textAlign: 'center', marginTop: 30 }}>No messages yet. Say hello.</p>
        )}
        <div className="msgs">
          {messages.map(m => <Bubble key={m.id} m={m} mine={m.senderId === user?.id} />)}
        </div>
        {error && <p style={{ color: 'var(--tx)', fontWeight: 600, textAlign: 'center' }}>{error}</p>}
      </div>

      {readOnly ? null : recording ? (
        <div className="cmp">
          <span className="rec-dot" />
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 650 }}>{fmtDur(recordTime)}</span>
          <span style={{ flex: 1 }} />
          <button className="ib" onClick={cancelRecording} aria-label="Cancel"><Icon name="x" size={20} /></button>
          <button className="ib" style={{ background: 'var(--tx)', color: 'var(--bg)' }} onClick={stopAndSend} aria-label="Send voice"><Icon name="send" size={18} /></button>
        </div>
      ) : (
        <div className="cmp">
          <input ref={fileRef} type="file" hidden onChange={sendFile} />
          <button className="ib" onClick={() => fileRef.current?.click()} aria-label="Attach" disabled={uploading}>
            <Icon name="paperclip" size={20} />
          </button>
          <input value={text} onChange={e => setText(e.target.value)}
            placeholder={uploading ? 'Uploading…' : 'Write a message…'}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            disabled={uploading} />
          <button className="ib" onClick={startRecording} aria-label="Record voice"><Icon name="mic" size={20} /></button>
          <button className="ib" style={{ background: 'var(--tx)', color: 'var(--bg)' }} onClick={send} aria-label="Send" disabled={uploading}>
            <Icon name="send" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
