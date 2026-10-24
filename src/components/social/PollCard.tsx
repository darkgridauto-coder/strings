'use client';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export type Poll = {
  id: string;
  question: string;
  closesAt: string | null;
  options: { id: string; text: string; votes: number }[];
  votedOptionId: string | null;
};

export function PollCard({ poll, onVoted }: { poll: Poll; onVoted?: () => void }) {
  const { showToast } = useToast();
  const [data, setData] = useState<Poll>(poll);
  const [busy, setBusy] = useState(false);

  const closed = data.closesAt ? new Date(data.closesAt).getTime() < Date.now() : false;
  const total = data.options.reduce((n, o) => n + o.votes, 0);
  const voted = !!data.votedOptionId;

  async function vote(optionId: string) {
    if (busy || voted || closed) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/polls/${data.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const d = await r.json();
      if (d.ok) {
        setData({ ...data, ...d.poll });
        onVoted?.();
      } else {
        showToast(d.error || 'Could not vote');
      }
    } catch {
      showToast('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: 14,
        marginTop: 10,
      }}
    >
      <b style={{ display: 'block', marginBottom: 10, fontSize: '.95em' }}>{data.question}</b>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.options.map((o) => {
          const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
          const mine = data.votedOptionId === o.id;
          const disabled = voted || closed || busy;
          return (
            <button
              key={o.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                vote(o.id);
              }}
              disabled={disabled}
              style={{
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 12,
                border: mine ? '1.5px solid var(--tx)' : '1px solid var(--line)',
                background: 'var(--bg)',
                cursor: disabled ? 'default' : 'pointer',
                color: 'inherit',
              }}
            >
              {voted && pct > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: pct + '%',
                    background: mine ? 'var(--b2)' : 'var(--bg-2)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: '.92em',
                }}
              >
                <span style={{ fontWeight: mine ? 650 : 500 }}>{o.text}</span>
                {voted && <span className="muted">{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="muted" style={{ fontSize: '.78em', marginTop: 8 }}>
        {total} vote{total === 1 ? '' : 's'}
        {closed
          ? ' · Closed'
          : data.closesAt
            ? ` · Closes ${new Date(data.closesAt).toLocaleDateString()}`
            : ''}
      </div>
    </div>
  );
}
