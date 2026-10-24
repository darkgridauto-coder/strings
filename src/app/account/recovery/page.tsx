'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

export default function Page() {
  const [id, setId] = useState('');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMessage('');
    if (!id.trim()) return setErr('Enter your email.');
    setBusy(true);
    
    try {
      const r = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: id }),
      });
      const d = await r.json();
      if (!d.ok) {
        setErr(d.error || 'Failed to send recovery email.');
      } else {
        setMessage('If an account matches, recovery steps have been sent. Please check your inbox and spam folder.');
      }
    } catch {
      setErr('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Recovery</p>
      <h1 style={{ marginBottom: 6 }}>Recover your account</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Enter your email to receive recovery steps.</p>
      <form onSubmit={submit}>
        <Field label="Email"><input type="email" value={id} onChange={(e) => setId(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        {message && <div className="card" style={{ background: 'var(--bg-2)' }}><p style={{ margin: 0, fontSize: '.92em', color: 'var(--tx)' }}>{message}</p></div>}
        <Button type="submit" block disabled={busy}>{busy ? 'Sending…' : 'Send recovery steps'}</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
        <Link href="/login">Remembered? <strong>Sign in</strong></Link>
      </p>
    </AuthSplit>
  );
}
