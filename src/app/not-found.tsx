import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, letterSpacing: '.5em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--tx-2)' }}>
        Strings
      </p>
      <h1 style={{ marginTop: 12 }}>Page not found</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        This page may have moved, been removed, or isn&apos;t available to you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
        <Button href="/" block>Go home</Button>
        <Button href="/app" variant="outline" block>Open app</Button>
      </div>
      <p className="muted" style={{ marginTop: 32, fontSize: '.85em' }}>
        <Link href="/app/help">Help center</Link>
      </p>
    </main>
  );
}
