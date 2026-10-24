'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [code, setCode] = useState('');

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email || !password) return setErr('Enter your email and password.');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setErr('Invalid email or password.'); setBusy(false); return; }
      if (d.needs2FA) { setNeeds2FA(true); setBusy(false); return; }
      window.location.href = '/app';
    } catch { setErr('Network error'); setBusy(false); }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!code) return setErr('Enter your 2FA code.');
    setBusy(true);
    try {
      const r = await fetch('/api/2fa/verify-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) { setErr(d.error || 'Invalid code'); setBusy(false); return; }
      window.location.href = '/app';
    } catch { setErr('Network error'); setBusy(false); }
  }

  if (needs2FA) {
    return (
      <AuthSplit>
        <p className="auth-brand">Two-factor</p>
        <h1 style={{ marginBottom: 6 }}>Enter your code</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          Open your authenticator app and enter the 6-digit code. If you lost access, use a backup code.
        </p>
        <form onSubmit={submitCode}>
          <Field label="6-digit code or backup code">
            <input value={code} onChange={(e) => setCode(e.target.value.slice(0, 9))} autoFocus autoComplete="one-time-code" placeholder="000000" />
          </Field>
          {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
          <Button type="submit" block disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</Button>
        </form>
        <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
          <button onClick={() => { setNeeds2FA(false); setCode(''); setErr(''); }}>← Back to sign in</button>
        </p>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Sign in</p>
      <h1 style={{ marginBottom: 6 }}>Welcome back</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Sign in to continue to Strings.</p>
      <form onSubmit={submitPassword}>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
        <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" /></Field>
        <p style={{ textAlign: 'right', fontSize: '.9em', margin: '0 0 12px' }}>
          <Link href="/account/recovery"><strong>Forgot login details?</strong></Link>
        </p>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        <Button type="submit" block disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
        New to Strings? <Link href="/signup"><strong>Create account</strong></Link>
      </p>
    </AuthSplit>
  );
}
