'use client';
import Link from 'next/link';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Strings',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://strings-app.onrender.com',
    description: 'Connect in transparency... black and white.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthSplit>
        <p className="auth-brand">Strings</p>
        <h1 style={{ fontSize: 'clamp(2.2em, 6vw, 3.2em)', lineHeight: 1.05, letterSpacing: '-.04em', marginBottom: 16 }}>
          Connect.<br />Share.<br />Communicate.
        </h1>
        <p className="muted" style={{ marginBottom: 24, fontSize: '1.02em' }}>
          Connect in transparency... black and white.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <Button href="/signup">Create account</Button>
          <Button href="/login" variant="outline">Sign in</Button>
        </div>
        <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: '.9em' }}>
          <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/guidelines">Guidelines</Link>
        </p>
      </AuthSplit>
    </>
  );
}
