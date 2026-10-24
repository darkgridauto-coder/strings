'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { useUser } from '@/components/UserProvider';

export default function Page() {
  const router = useRouter();
  const { user, refresh } = useUser();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) { setName(user.displayName); setBio(user.bio || ''); }
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!name.trim()) return setErr('Display name is required.');
    if (bio.length > 160) return setErr('Bio is limited to 160 characters.');
    setBusy(true);
    try {
      const r = await fetch('/api/users/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim(), bio }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Save failed'); setBusy(false); return; }
      refresh();
      router.push('/onboarding/notifications');
    } catch { setErr('Network error'); setBusy(false); }
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Step 1 of 2</p>
      <h1 style={{ marginBottom: 6 }}>Set up your profile</h1>
      <p className="muted" style={{ marginBottom: 12 }}>Introduce yourself to the Strings community.</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <Avatar name={name || 'Your Name'} size="lg" />
      </div>
      <form onSubmit={submit}>
        <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Bio" hint={`${bio.length}/160 (optional)`}>
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} placeholder="A few words about you" />
        </Field>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        <Button type="submit" block disabled={busy}>{busy ? 'Saving…' : 'Continue'}</Button>
      </form>
    </AuthSplit>
  );
}
