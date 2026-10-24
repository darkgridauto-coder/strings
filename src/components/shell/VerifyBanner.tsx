'use client';
import Link from 'next/link';
import { useUser } from '@/components/UserProvider';
import { Icon } from '@/components/ui/Icon';

export function VerifyBanner() {
  const { user } = useUser();
  if (!user || (user as any).emailVerified) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', margin: '8px 0', background: 'var(--b2)', border: '1px solid var(--ln)', borderRadius: 14 }}>
      <Icon name="shield" size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: '.92em' }}>Verify your email to unlock posting and messaging</b>
        <small className="muted" style={{ fontSize: '.8em' }}>We sent a code to {(user as any).email}.</small>
      </div>
      <Link className="pill on" href="/verify">Verify</Link>
    </div>
  );
}
