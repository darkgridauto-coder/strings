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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMessage('');
    if (!id.trim()) return setErr('Enter your email.');
    setMessage('If an account matches, recovery steps have been sent. This response is intentionally identical whether or not the account exists (privacy-preserving). No email was actually sent — mail backend is not built yet.');
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Recovery</p>
      <h1 style={{ marginBottom: 6 }}>Recover your account</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Enter your email to receive recovery steps.</p>
      <form onSubmit={submit}>
        <Field label="Email"><input type="email" value={id} onChange={(e) => setId(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        {message && <div className="card"><p style={{ margin: 0, fontSize: '.92em', color: 'var(--t2)' }}>{message}</p></div>}
        <Button type="submit" block>Send recovery steps</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
        <Link href="/login">Remembered? <strong>Sign in</strong></Link>
      </p>
    </AuthSplit>
  );
}
