'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useUser } from '@/components/UserProvider';

type U = { id: string; handle: string; displayName: string; avatar?: string | null; bio?: string };

export function NewMessageSheet() {
  const router = useRouter();
  const { closeSheet, openSheet } = useSheet();
  const { showToast } = useToast();
  const { user } = useUser();
  const [mode, setMode] = useState<'single' | 'group'>('single');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<U[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const to = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setResults((d.users || []).filter((u: U) => u.handle !== user?.handle));
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(to);
  }, [q, user?.handle]);

  function start(handle: string) {
    closeSheet();
    router.push(`/app/messages/${handle}`);
  }

  function toggle(handle: string) {
    const next = new Set(selected);
    if (next.has(handle)) next.delete(handle); else next.add(handle);
    setSelected(next);
  }

  async function createGroup() {
    if (!groupName.trim()) return showToast('Name the group');
    if (selected.size < 1) return showToast('Pick at least one person');
    setBusy(true);
    try {
      const r = await fetch('/api/groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), handles: Array.from(selected) }),
      });
      const d = await r.json();
      if (!d.ok) { showToast(d.error || 'Group creation failed'); setBusy(false); return; }
      closeSheet();
      router.push(`/app/groups/${d.conversation.id}`);
    } catch { showToast('Network error'); setBusy(false); }
  }

  if (mode === 'group') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button className="ib" onClick={() => setMode('single')} aria-label="Back"><Icon name="back" /></button>
          <h3 style={{ margin: 0, flex: 1 }}>New group</h3>
          <button className="pill on" onClick={createGroup} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
        </div>
        <label className="field">
          <span className="field-label">Group name</span>
          <input value={groupName} onChange={(e) => setGroupName(e.target.value.slice(0, 60))} placeholder="e.g. Weekend plans" autoFocus />
        </label>
        <label className="field">
          <span className="field-label">Find people</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or handle" />
        </label>
        {selected.size > 0 && (
          <p className="muted" style={{ fontSize: '.85em' }}>{selected.size} selected</p>
        )}
        {loading && <p className="muted" style={{ padding: 12 }}>Searching…</p>}
        {results.map((u) => (
          <button key={u.id} className="row" onClick={() => toggle(u.handle)} style={{ width: '100%', textAlign: 'left', borderBottom: 0 }}>
            <Avatar name={u.displayName} src={u.avatar || undefined} size="sm" />
            <div className="row-body">
              <span className="row-title">{u.displayName}</span>
              <span className="row-sub">@{u.handle}</span>
            </div>
            <span style={{
              width: 22, height: 22, borderRadius: 11,
              border: '1.5px solid var(--b3)',
              display: 'grid', placeItems: 'center',
              background: selected.has(u.handle) ? 'var(--tx)' : 'transparent',
              color: selected.has(u.handle) ? 'var(--bg)' : 'transparent',
            }}>{selected.has(u.handle) ? <Icon name="check" size={12} /> : null}</span>
          </button>
        ))}
        {q && !loading && results.length === 0 && <p className="muted" style={{ padding: 12 }}>No matches.</p>}
        {!q && <p className="muted" style={{ padding: 12, fontSize: '.88em' }}>Type a name or handle to search.</p>}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>New message</h3>
      <button
        onClick={() => setMode('group')}
        className="row"
        style={{ width: '100%', textAlign: 'left', borderBottom: '1px solid var(--ln)' }}
      >
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--b2)', display: 'grid', placeItems: 'center' }}>
          <Icon name="users" />
        </span>
        <div className="row-body">
          <span className="row-title">New group</span>
          <span className="row-sub">Chat with several people</span>
        </div>
        <Icon name="chevron" size={16} />
      </button>
      <label className="field" style={{ marginTop: 12 }}>
        <span className="field-label">Search people</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or @handle" autoFocus />
      </label>
      {loading && <p className="muted" style={{ padding: 12 }}>Searching…</p>}
      {!loading && q && results.length === 0 && <p className="muted" style={{ padding: 12 }}>No matches.</p>}
      {results.map((u) => (
        <button key={u.id} className="row" onClick={() => start(u.handle)} style={{ width: '100%', textAlign: 'left', borderBottom: 0 }}>
          <Avatar name={u.displayName} src={u.avatar || undefined} />
          <div className="row-body">
            <span className="row-title">{u.displayName}</span>
            <span className="row-sub">@{u.handle}</span>
          </div>
        </button>
      ))}
      {!q && (
        <p className="muted" style={{ padding: 12, fontSize: '.88em' }}>
          Type a name or @handle to find someone.
        </p>
      )}
    </div>
  );
}
