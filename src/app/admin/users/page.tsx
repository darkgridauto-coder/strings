'use client';
import { useEffect, useState } from 'react';
import { Table, Badge } from '@/components/admin/ui';

export default function Page() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`/api/admin/users?q=${q}&filter=${filter}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) setUsers(d.users); })
    .catch(() => console.error('Failed to load users'));
  }, [q, filter]);

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Users</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, handle, or email" style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--b2)' }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '11px 14px', borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--b2)' }}>
          <option value="all">All users</option>
          <option value="unverified">Unverified</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      
      <Table 
        headers={['Account', 'Email', 'Role', 'Status', 'Joined']}
        rows={users.map(u => [
          <div><b>{u.displayName}</b><br /><small style={{ color: 'var(--t2)' }}>@{u.handle}</small></div>,
          u.email,
          <Badge variant={u.role === 'admin' ? 'neutral' : undefined}>{u.role}</Badge>,
          <Badge variant={u.emailVerified ? 'ok' : 'bad'}>{u.emailVerified ? 'Verified' : 'Unverified'}</Badge>,
          new Date(u.createdAt).toLocaleDateString()
        ])}
        emptyMsg="No matching users."
      />
    </>
  );
}
