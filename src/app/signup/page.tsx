'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

export default function Page() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!displayName.trim()) return setErr('Enter your display name.');
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) return setErr('Username must be 3–20 lowercase letters, numbers, or underscores.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email.');
    if (password.length < 8) return setErr('Password must be at least 8 characters.');
    if (!agree) return setErr('Please accept the Terms and Privacy Policy.');

    setBusy(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, handle: handle.toLowerCase(), email, password }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setErr(d.error || 'Registration failed'); setBusy(false); return; }
      if (d.warning) {
        try { localStorage.setItem('strings.emailWarning', d.warning); } catch {}
      } else {
        try { localStorage.removeItem('strings.emailWarning'); } catch {}
      }
      router.push('/verify');
    } catch {
      setErr('Network error'); setBusy(false);
    }
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Create account</p>
      <h1 style={{ marginBottom: 6 }}>Join Strings</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Create your account to connect, share and communicate.</p>
      <form onSubmit={submit}>
        <Field label="Display name"><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" /></Field>
        <Field label="Username"><input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle" /></Field>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
        <Field label="Password" hint="At least 8 characters."><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a secure password" autoComplete="new-password" /></Field>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '12px 0', fontSize: '.92em' }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
          <span>I accept the <Link href="/legal/terms">Terms</Link> and <Link href="/legal/privacy">Privacy Policy</Link></span>
        </label>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        <Button type="submit" block disabled={busy}>{busy ? 'Creating…' : 'Create account'}</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
        Already have an account? <Link href="/login"><strong>Sign in</strong></Link>
      </p>
    </AuthSplit>
  );
}
