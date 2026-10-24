'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { useUser } from '@/components/UserProvider';

export default function Page() {
  const router = useRouter();
  const { user, refresh } = useUser();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName);
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
    setCover((user as any).cover || '');
  }, [user]);

  async function upload(file: File): Promise<string | null> {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) { showToast('Unsupported file'); return null; }
    if (file.size > 5e6) { showToast('Max 5 MB'); return null; }
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json();
    if (!d.ok) { showToast(d.error || 'Upload failed'); return null; }
    return d.url;
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await upload(f); if (url) setAvatar(url);
  }
  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const url = await upload(f); if (url) setCover(url);
  }

  async function save() {
    if (!name.trim()) return showToast('Display name required');
    setBusy(true);
    try {
      const r = await fetch('/api/users/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim(), bio, avatar, cover }),
      });
      const d = await r.json();
      if (!d.ok) { showToast(d.error || 'Save failed'); return; }
      refresh();
      showToast('Profile saved');
      router.push('/app/profile');
    } catch { showToast('Network error'); }
    finally { setBusy(false); }
  }

  return (
    <>
      <header className="topbar">
        <Link href="/app/profile" className="ib" aria-label="Back">←</Link>
        <h1>Edit profile</h1>
        <div className="topbar-actions">
          <Button size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </header>
      <div className="page">
        <div style={{ position: 'relative', height: 140, borderRadius: 20, background: cover ? `url(${cover}) center/cover` : 'repeating-linear-gradient(115deg, var(--b2) 0 12px, var(--b3) 12px 13px)', filter: cover ? 'grayscale(1)' : undefined, marginBottom: -40 }}>
          <button className="ib" onClick={() => coverRef.current?.click()} aria-label="Change cover"
            style={{ position: 'absolute', right: 12, bottom: 12, background: 'var(--tx)', color: 'var(--bg)' }}>
            <Icon name="img" size={18} />
          </button>
        </div>
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCover} />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: '0 8px' }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={name || 'You'} src={avatar || undefined} size="lg" />
            <button className="ib" onClick={() => avatarRef.current?.click()} aria-label="Change photo"
              style={{ position: 'absolute', right: -6, bottom: -6, background: 'var(--tx)', color: 'var(--bg)', width: 32, height: 32 }}>
              <Icon name="edit" size={14} />
            </button>
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" hidden onChange={onAvatar} />

        <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
        <Field label="Bio" hint={`${bio.length}/160`}>
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} />
        </Field>
        <p className="muted" style={{ fontSize: '.85em' }}>Username editing is not enabled in this build. Contact support to change your @handle.</p>
      </div>
    </>
  );
}
