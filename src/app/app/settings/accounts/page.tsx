'use client';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { useUser } from '@/components/UserProvider';
import Link from 'next/link';

export default function Page() {
  const { user } = useUser();
  return (
    <SettingsShell title="Accounts" back="/app/settings">
      <p className="muted">Signed-in accounts on this device. Account switching is a local convenience; each account has its own server-side session.</p>
      <Card>
        <b>{user?.displayName || 'You'}</b>
        <div className="muted" style={{ fontSize: '.9em' }}>@{user?.handle || 'you'} · Current</div>
      </Card>
      <Card>
        <b>Add account</b>
        <p className="muted" style={{ fontSize: '.9em', marginTop: 6 }}>
          Full multi-account switching UI is a future refinement. For now, sign out and back in with a different account to switch.
        </p>
        <Link href="/login" className="btn o" style={{ display: 'inline-block', marginTop: 12, padding: '10px 16px', borderRadius: 12 }}>Sign in to another account</Link>
      </Card>
    </SettingsShell>
  );
}
