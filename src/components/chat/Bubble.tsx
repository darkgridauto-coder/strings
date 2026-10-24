'use client';
import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { openImage } from '@/components/ui/ImageViewer';

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  mediaUrl?: string | null;
  mediaKind?: string | null;
  mediaDur?: number | null;
  replyToId?: string | null;
  reactions?: string | null;
  createdAt: string;
  readAt?: string | null;
};

type ReplyTarget = { senderName: string; preview: string } | null;

function parseReactions(raw: string | null | undefined): Record<string, string[]> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    return v as Record<string, string[]>;
  } catch { return {}; }
}

export function Bubble({
  m,
  mine,
  replyTo,
  currentUserId,
  onOpenActions,
}: {
  m: ChatMessage;
  mine: boolean;
  replyTo?: ReplyTarget;
  currentUserId?: string;
  onOpenActions?: (id: string) => void;
}) {
  const t = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isImg = m.mediaKind === 'image' && m.mediaUrl;
  const isFile = m.mediaKind === 'file' && m.mediaUrl;
  const isVoice = m.mediaKind === 'voice' && m.mediaUrl;
  const seen = mine && !!m.readAt;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reactions = parseReactions(m.reactions);
  const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);

  useEffect(() => {
    if (!audioRef.current) return;
    const el = audioRef.current;
    const end = () => setPlaying(false);
    el.addEventListener('ended', end);
    return () => el.removeEventListener('ended', end);
  }, []);

  function toggleVoice() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  }

  function fmtDur(s: number) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

  function startLongPress() {
    if (!onOpenActions) return;
    longPressRef.current = setTimeout(() => { onOpenActions(m.id); }, 450);
  }
  function cancelLongPress() {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  }
  function onContextMenu(e: React.MouseEvent) {
    if (!onOpenActions) return;
    e.preventDefault();
    onOpenActions(m.id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
      <div
        className={`b ${mine ? 'me' : ''}`}
        style={{ position: 'relative' }}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={onContextMenu}
      >
        {replyTo && (
          <div style={{
            borderLeft: `3px solid ${mine ? 'var(--bg)' : 'var(--tx)'}`,
            opacity: 0.75,
            padding: '2px 8px',
            marginBottom: 6,
            fontSize: '.82em',
            lineHeight: 1.35,
            maxWidth: '100%',
          }}>
            <b style={{ display: 'block', fontSize: '.9em' }}>{replyTo.senderName}</b>
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              {replyTo.preview}
            </span>
          </div>
        )}
        {isImg && (
          <div style={{ position: 'relative' }}>
            <img src={m.mediaUrl!} alt="" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, display: 'block', cursor: 'pointer' }} onClick={() => openImage(m.mediaUrl!)} />
          </div>
        )}
        {isVoice && (
          <button onClick={toggleVoice} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', padding: '2px 0', minWidth: 170 }}>
            <span style={{ width: 32, height: 32, borderRadius: 16, background: mine ? 'var(--bg)' : 'var(--tx)', color: mine ? 'var(--tx)' : 'var(--bg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={playing ? 'pause' : 'play'} size={14} />
            </span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <i key={i} style={{ display: 'block', width: 3, height: 4 + ((i * 7) % 14), background: 'currentColor', borderRadius: 2, opacity: playing ? 0.95 : 0.4, transition: 'opacity .2s' }} />
              ))}
            </div>
            <span style={{ fontSize: '.72em', fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>{fmtDur(m.mediaDur || 0)}</span>
          </button>
        )}
        {isFile && (
          <a href={m.mediaUrl!} target="_blank" rel="noopener noreferrer" download style={{ display: 'flex', gap: 8, alignItems: 'center', textDecoration: 'none', padding: 4 }}>
            <Icon name="doc" size={20} />
            <span style={{ fontWeight: 600, fontSize: '.9em', textDecoration: 'underline' }}>{m.body || 'File'}</span>
            <Icon name="dl" size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </a>
        )}
        {!isImg && !isFile && !isVoice && <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</span>}
        <small>{t}{mine ? ' · Sent' : ''}</small>
        {isVoice && <audio ref={audioRef} src={m.mediaUrl!} preload="metadata" style={{ display: 'none' }} />}
      </div>

      {reactionEntries.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
          {reactionEntries.map(([emoji, users]) => {
            const mineReacted = currentUserId ? users.includes(currentUserId) : false;
            return (
              <span
                key={emoji}
                style={{
                  display: 'inline-flex',
                  gap: 3,
                  alignItems: 'center',
                  padding: '1px 7px',
                  borderRadius: 10,
                  background: mineReacted ? 'var(--tx)' : 'var(--b2)',
                  color: mineReacted ? 'var(--bg)' : 'var(--tx)',
                  fontSize: '.75em',
                  fontWeight: 600,
                  border: '1px solid var(--ln)',
                }}
              >
                {emoji} {users.length}
              </span>
            );
          })}
        </div>
      )}

      {mine && (
        <span className="rcp" data-seen={seen ? '1' : '0'}>
          {seen ? <Icon name="checkcheck" size={11} /> : <Icon name="check" size={11} />}
          {seen ? 'Seen' : 'Sent'}
        </span>
      )}
    </div>
  );
}
