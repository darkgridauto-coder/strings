'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ComposeSheet } from '@/components/social/ComposeSheet';

export default function Page() {
  const router = useRouter();
  useEffect(() => { /* composer is a sheet; but the URL stays valid */ }, []);
  return (
    <>
      <header className="topbar">
        <Link href="/app" className="ib" aria-label="Back"><Icon name="back" /></Link>
        <h1>Create post</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <div className="card">
          <ComposeSheet />
        </div>
      </div>
    </>
  );
}
