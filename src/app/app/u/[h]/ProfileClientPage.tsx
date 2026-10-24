'use client';
import { useUser } from '@/components/UserProvider';
import { ProfileView } from '@/components/profile/ProfileView';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export default function ProfileClientPage({ params }: { params: { h: string } }) {
  const { user } = useUser();
  if (user && user.handle === params.h) {
    return (
      <>
        <header className="topbar">
          <Link href="/app" className="ib" aria-label="Back">←</Link>
          <h1>Profile</h1>
          <div className="topbar-actions" />
        </header>
        <div className="page"><ProfileView handle={params.h} /></div>
      </>
    );
  }
  return (
    <>
      <header className="topbar">
        <Link href="/app" className="ib" aria-label="Back">←</Link>
        <h1>Profile</h1>
        <div className="topbar-actions">
          <button className="ib" aria-label="More"><Icon name="more" /></button>
        </div>
      </header>
      <div className="page"><ProfileView handle={params.h} /></div>
    </>
  );
}
