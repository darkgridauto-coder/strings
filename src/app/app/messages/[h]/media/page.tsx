'use client';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

type Tab = 'media' | 'files' | 'links';

export default function Page({ params }: { params: { h: string } }) {
  const [tab, setTab] = useState<Tab>('media');
  return (
    <>
      <header className="topbar">
        <a href={`/app/messages/${params.h}`} style={{ padding: 8, fontSize: 20 }} aria-label="Back">←</a>
        <h1>Shared media</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <p className="muted">@{params.h}</p>
        <div className="feed-tabs">
          <button className={tab === 'media' ? 'on' : ''} onClick={() => setTab('media')}>Media</button>
          <button className={tab === 'files' ? 'on' : ''} onClick={() => setTab('files')}>Files</button>
          <button className={tab === 'links' ? 'on' : ''} onClick={() => setTab('links')}>Links</button>
        </div>
        <EmptyState icon="img" title={`No ${tab} shared yet`}>
          Items shared in this conversation will appear here once messaging is backed by a server.
        </EmptyState>
      </div>
    </>
  );
}
