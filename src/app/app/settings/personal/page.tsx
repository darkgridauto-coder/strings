'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/components/UserProvider';
import { useToast } from '@/components/ui/Toast';

export default function Page() {
  const { user, patchUser } = useUser();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName);
      setDob(user.settings?.dob || '');
    }
  }, [user]);

  async function save() {
    setBusy(true);
    await patchUser({ displayName: name, settings: { dob } });
    showToast('Personal information saved');
    setBusy(false);
  }

  return (
    <SettingsShell title="Personal information" back="/app/settings">
      <p className="muted">Manage the personal details associated with your account.</p>
      <Field label="Display name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your display name" /></Field>
      <Field label="Username" hint="Username editing is not available here."><input value={`@${user?.handle}`} disabled /></Field>
      <Field label="Date of birth"><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
      <Button onClick={save} disabled={busy} block>{busy ? 'Saving…' : 'Save changes'}</Button>
      <div className="card" style={{ marginTop: 16 }}>
        <strong>Account identity</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>Display name is public. Date of birth is private.</p>
      </div>
    </SettingsShell>
  );
}
