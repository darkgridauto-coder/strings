'use client';
import { useState } from 'react';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

export default function Page() {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (p1.length < 8) return setErr('Use at least 8 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');
    setErr('Password reset requires a valid recovery session. The recovery flow will be implemented when email delivery is connected.');
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Reset</p>
      <h1 style={{ marginBottom: 6 }}>Reset your credentials</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Set a new password after verifying your recovery request.</p>
      <form onSubmit={submit}>
        <Field label="New password" hint="At least 8 characters.">
          <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} placeholder="New password" autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
        </Field>
        {err && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{err}</p>}
        <Button type="submit" block>Update password</Button>
      </form>
    </AuthSplit>
  );
}
