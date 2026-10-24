'use client';
import { useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

export default function Page() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function deleteAccount() {
    setError('');
    if (!password) return setError('Enter your password to confirm.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Deletion failed'); setLoading(false); return; }
      window.location.href = '/signup';
    } catch { setError('Network error'); setLoading(false); }
  }

  return (
    <SettingsShell title="Delete account" back="/app/settings">
      <Card>
        <strong>This action is permanent</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>
          Deleting your account removes your profile, your posts, and all your sessions. Your email and username become available again. You can create a new account with the same email and username afterward — it starts fresh with no old data.
        </p>
      </Card>
      {!confirmed ? (
        <Button variant="outline" block onClick={() => setConfirmed(true)}>I understand, continue</Button>
      ) : (
        <>
          <Field label="Password" hint="Confirm your identity">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
          </Field>
          {error && <p style={{ fontWeight: 600, fontSize: '.9em', margin: '8px 0' }}>{error}</p>}
          <Button block onClick={deleteAccount} disabled={loading}>{loading ? 'Deleting…' : 'Delete my account'}</Button>
          <button className="btn btn-ghost btn-block" onClick={() => setConfirmed(false)} style={{ marginTop: 8 }}>Cancel</button>
        </>
      )}
    </SettingsShell>
  );
}
