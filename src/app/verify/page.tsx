'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/components/UserProvider';

export default function Page() {
  const router = useRouter();
  const { user, refresh } = useUser();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && (user as any).emailVerified) router.push('/onboarding/profile');
    if (user && (user as any).email) setEmail((user as any).email);
  }, [user, router]);

  // Auto-focus the hidden input on mount — the user can start typing immediately
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, [wait]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!/^\d{6}$/.test(code)) return setErr('Enter the 6-digit code.');
    setBusy(true);
    try {
      const r = await fetch('/api/auth/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Verification failed'); setBusy(false); return; }
      refresh();
      router.push('/onboarding/profile');
    } catch { setErr('Network error'); setBusy(false); }
  }

  async function resend() {
    if (wait > 0) return;
    setErr('');
    try {
      const r = await fetch('/api/auth/resend-code', { method: 'POST' });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'Could not resend'); return; }
      setWait(60);
      setCode('');
      inputRef.current?.focus();
      if (d.dev) setErr('Dev mode: check the server terminal for the code.');
      else setEmail(d.email || email);
    } catch { setErr('Network error'); }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(v);
    setErr('');
  }

  const currentIndex = Math.min(code.length, 5);

  return (
    <AuthSplit>
      <p className="auth-brand">Verification</p>
      <h1 style={{ marginBottom: 6 }}>Verify your email</h1>
      <p className="muted" style={{ marginBottom: 12 }}>
        We sent a 6-digit code to <b>{email || 'your email'}</b>. The code expires in 10 minutes.
      </p>
      <form onSubmit={submit}>
        <div
          className="otp"
          onClick={() => inputRef.current?.focus()}
          role="group"
          aria-label="6-digit verification code"
        >
          {[0,1,2,3,4,5].map((i) => (
            <i
              key={i}
              className={code[i] ? 'f' : (focused && i === currentIndex ? 'active' : '')}
              aria-hidden="true"
            >
              {code[i] ?? ''}
            </i>
          ))}
          <input
            ref={inputRef}
            value={code}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            aria-label="Verification code"
          />
        </div>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        <Button type="submit" block disabled={busy || code.length < 6}>
          {busy ? 'Verifying…' : 'Verify'}
        </Button>
      </form>
      <p className="muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.92em' }}>
        Didn&apos;t receive it?{' '}
        <button
          type="button"
          onClick={resend}
          disabled={wait > 0}
          style={{ fontWeight: 650, color: wait > 0 ? 'var(--tx-2)' : 'var(--tx)', cursor: wait > 0 ? 'default' : 'pointer' }}
        >
          {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
        </button>
      </p>
      <p className="muted" style={{ textAlign: 'center', marginTop: 8, fontSize: '.92em' }}>
        <Link href="/signup">Change contact detail</Link>
      </p>
    </AuthSplit>
  );
}
