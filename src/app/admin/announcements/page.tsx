'use client';
import { useEffect, useState } from 'react';
import { Table } from '@/components/admin/ui';
import { useToast } from '@/components/ui/Toast';

export default function Page() {
  const { showToast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    fetch('/api/admin/announcements')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) setList(d.announcements); })
    .catch(() => console.error('Failed to load announcements'));
  }
  useEffect(() => { load(); }, []);

  async function publish() {
    if (title.length < 2 || message.length < 5) return showToast('Title and message required');
    const r = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, message }) });
    if (r.ok) { showToast('Published'); setTitle(''); setMessage(''); load(); }
  }

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Announcements</h2>
      
      <div style={{ background: 'var(--b2)', borderRadius: 20, padding: 18, maxWidth: 640, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1em', textTransform: 'none' }}>New announcement</h3>
        <label style={{ display: 'block', margin: '12px 0' }}><span style={{ display: 'block', fontSize: '.8rem', color: 'var(--t2)', marginBottom: 4 }}>Title</span><input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--bg)' }} /></label>
        <label style={{ display: 'block', margin: '12px 0' }}><span style={{ display: 'block', fontSize: '.8rem', color: 'var(--t2)', marginBottom: 4 }}>Message</span><textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={200} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--ln)', background: 'var(--bg)' }} /></label>
        <button onClick={publish} style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--tx)', color: 'var(--bg)', fontWeight: 600, border: 0, cursor: 'pointer' }}>Publish to all users</button>
      </div>

      <h3 style={{ margin: '0 0 12px', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t2)' }}>History</h3>
      <Table 
        headers={['Published', 'Title', 'Message']}
        rows={list.map(a => [
          new Date(a.createdAt).toLocaleString(),
          a.title,
          a.message
        ])}
        emptyMsg="No announcements yet."
      />
    </>
  );
}
