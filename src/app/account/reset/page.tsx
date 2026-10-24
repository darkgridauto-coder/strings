'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email || !code) return setErr('Email and code are required.');
    if (p1.length < 8) return setErr('Password must be at least 8 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');

    setBusy(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: p1 }),
      });
      const d = await r.json();
      if (!d.ok) {
        setErr(d.error || 'Reset failed.');
        setBusy(false);
      } else {
        router.push('/login?reset=success');
      }
    } catch {
      setErr('Network error');
      setBusy(false);
    }
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Reset</p>
      <h1 style={{ marginBottom: 6 }}>Reset your password</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Enter the code we emailed you and choose a new password.</p>
      <form onSubmit={submit}>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
        <Field label="6-digit code"><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></Field>
        <Field label="New password" hint="At least 8 characters."><input type="password" value={p1} onChange={(e) => setP1(e.target.value)} /></Field>
        <Field label="Confirm new password"><input type="password" value={p2} onChange={(e) => setP2(e.target.value)} /></Field>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        <Button type="submit" block disabled={busy}>{busy ? 'Resetting…' : 'Update password'}</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </AuthSplit>
  );
}
