'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/Row';
import { useToast } from '@/components/ui/Toast';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/navigation';

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const [group, setGroup] = useState<any>(null);
  const [rename, setRename] = useState('');
  const [addHandle, setAddHandle] = useState('');

  function load() {
    fetch(`/api/groups/${params.id}`).then((r) => r.json()).then((d) => { if (d.ok) { setGroup(d.conversation); setRename(d.conversation.groupName || ''); } });
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params.id]);

  const myRole = group?.roles?.find((r: any) => r.userId === user?.id)?.role;
  const canManage = myRole === 'owner' || myRole === 'admin';

  async function saveName() {
    const r = await fetch(`/api/groups/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: rename }) });
    if (r.ok) { showToast('Renamed'); load(); } else showToast('Not allowed');
  }
  async function addMember() {
    if (!addHandle.trim()) return;
    const r = await fetch(`/api/groups/${params.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle: addHandle.trim().replace(/^@/, '') }) });
    if (r.ok) { showToast('Member added'); setAddHandle(''); load(); }
    else showToast('Failed to add');
  }
  async function removeMember(userId: string) {
    const r = await fetch(`/api/groups/${params.id}/members/${userId}`, { method: 'DELETE' });
    if (r.ok) { showToast('Removed'); load(); } else showToast('Failed');
  }
  async function leave() {
    const r = await fetch(`/api/groups/${params.id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Left group'); router.push('/app/messages'); }
  }

  return (
    <>
      <header className="topbar">
        <Link href={`/app/groups/${params.id}`} className="ib" aria-label="Back">←</Link>
        <h1>Group settings</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        {!group && <p className="muted">Loading…</p>}
        {group && (
          <>
            <h2 style={{ marginTop: 0 }}>{group.groupName}</h2>
            <p className="muted">{group.participants.length} members</p>

            {canManage && (
              <>
                <h3>Rename group</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label className="field" style={{ flex: 1, margin: 0 }}>
                    <input value={rename} onChange={(e) => setRename(e.target.value)} />
                  </label>
                  <Button size="sm" onClick={saveName}>Save</Button>
                </div>
                <h3>Add member</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label className="field" style={{ flex: 1, margin: 0 }}>
                    <input value={addHandle} onChange={(e) => setAddHandle(e.target.value)} placeholder="@handle" />
                  </label>
                  <Button size="sm" onClick={addMember}>Add</Button>
                </div>
              </>
            )}

            <h3>Members</h3>
            {group.participants.map((p: any) => {
              const role = group.roles.find((r: any) => r.userId === p.id)?.role || 'member';
              return (
                <div key={p.id} className="row" style={{ cursor: 'default' }}>
                  <Avatar name={p.displayName} src={p.avatar || undefined} />
                  <div className="row-body">
                    <span className="row-title">{p.displayName}</span>
                    <span className="row-sub">@{p.handle}{role === 'owner' ? ' · Owner' : role === 'admin' ? ' · Admin' : ''}</span>
                  </div>
                  {canManage && p.id !== user?.id && (
                    <button className="pill sm" onClick={() => removeMember(p.id)}>Remove</button>
                  )}
                </div>
              );
            })}

            <h3>Leave</h3>
            <Button onClick={leave} variant="outline">Leave group</Button>
          </>
        )}
      </div>
    </>
  );
}
