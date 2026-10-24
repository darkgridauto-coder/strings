export function MessageBubble({ from, text, time }: { from: 'me' | 'other'; text: string; time: string }) {
  const isMe = from === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{
        maxWidth: '78%', padding: '10px 14px', borderRadius: 18,
        background: isMe ? 'var(--tx)' : 'var(--bg-2)',
        color: isMe ? 'var(--bg)' : 'var(--tx)',
      }}>
        <div>{text}</div>
        <div style={{ fontSize: '.72em', opacity: .65, textAlign: isMe ? 'right' : 'left', marginTop: 4 }}>{time}</div>
      </div>
    </div>
  );
}
