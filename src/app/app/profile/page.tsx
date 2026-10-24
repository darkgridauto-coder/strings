'use client';
import { useUser } from '@/components/UserProvider';
import { ProfileView } from '@/components/profile/ProfileView';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function Page() {
  const { user } = useUser();
  if (!user) return (
    <div className="page"><p className="muted" style={{ textAlign: 'center', padding: 40 }}>Loading…</p></div>
  );
  return (
    <>
      <header className="topbar">
        <span style={{ width: 42 }} />
        <h1>Profile</h1>
        <div className="topbar-actions">
          <Link className="ib" href="/app/settings" aria-label="Settings"><Icon name="gear" /></Link>
        </div>
      </header>
      <div className="page">
        <ProfileView handle={user.handle} />
      </div>
    </>
  );
}
