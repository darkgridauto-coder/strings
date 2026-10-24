'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { VaultNote, encryptNote, decryptNote, loadNotes, saveNotes } from '@/lib/vault';

export default function Page() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pass, setPass] = useState('');
  const [oneShot, setOneShot] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openPass, setOpenPass] = useState('');
  const [openBody, setOpenBody] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setNotes(loadNotes()); }, []);

  async function addNote() {
    if (!title.trim() || !body.trim()) return showToast('Title and body required');
    if (pass.length < 8) return showToast('Passphrase must be 8+ characters');
    setBusy(true);
    try {
      const note = await encryptNote(title.trim(), body, pass, oneShot);
      const next = [note, ...notes];
      setNotes(next); saveNotes(next);
      setTitle(''); setBody(''); setPass('');
      showToast('Note encrypted and saved');
    } catch (e: any) { showToast(e.message || 'Failed to save'); }
    finally { setBusy(false); }
  }

  async function openNote(note: VaultNote) {
    try {
      const pt = await decryptNote(note, openPass);
      setOpenBody(pt);
      if (note.oneShot) {
        const next = notes.filter((n) => n.id !== note.id);
        setNotes(next); saveNotes(next);
      }
    } catch { showToast('Wrong passphrase'); }
  }

  function destroy(id: string) {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next); saveNotes(next); showToast('Destroyed');
  }

  return (
    <SettingsShell title="Secure vault" back="/app/settings/pro">
      <p className="muted">Notes encrypted with AES-256-GCM, key derived from your passphrase (PBKDF2, 250,000 rounds). The passphrase never leaves this device.</p>
      <h3>New note</h3>
      <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></Field>
      <Field label="Body"><textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 2000))} style={{ minHeight: 120 }} /></Field>
      <Field label="Passphrase (8+ chars)"><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '12px 0', fontSize: '.92em' }}>
        <input type="checkbox" checked={oneShot} onChange={(e) => setOneShot(e.target.checked)} />
        <span>Destroy after first read</span>
      </label>
      <Button onClick={addNote} disabled={busy} block>{busy ? 'Encrypting…' : 'Encrypt and save'}</Button>
      <h3>Saved notes ({notes.length})</h3>
      {notes.length === 0 && <p className="muted">No notes yet.</p>}
      {notes.map((n) => (
        <Card key={n.id}>
          <b>{n.title}</b>
          <div className="muted" style={{ fontSize: '.85em', marginBottom: 8 }}>{n.oneShot ? 'Destroys on first read' : 'Encrypted'} · {new Date(n.createdAt).toLocaleString()}</div>
          {openId === n.id ? (
            openBody === null ? (
              <>
                <Field label="Passphrase"><input type="password" value={openPass} onChange={(e) => setOpenPass(e.target.value)} /></Field>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" onClick={() => openNote(n)}>Decrypt</Button>
                  <Button size="sm" variant="outline" onClick={() => { setOpenId(null); setOpenPass(''); }}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ whiteSpace: 'pre-wrap', padding: 12, background: 'var(--bg)', borderRadius: 12, marginBottom: 8 }}>{openBody}</div>
                <Button size="sm" variant="outline" onClick={() => { setOpenId(null); setOpenPass(''); setOpenBody(null); }}>Close</Button>
              </>
            )
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={() => { setOpenId(n.id); setOpenBody(null); setOpenPass(''); }}>Open</Button>
              <Button size="sm" variant="outline" onClick={() => destroy(n.id)}>Destroy</Button>
            </div>
          )}
        </Card>
      ))}
    </SettingsShell>
  );
}
