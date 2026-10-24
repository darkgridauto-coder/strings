'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Row } from '@/components/ui/Row';

export default function Page() {
  const [trending] = useState<string[]>(['design', 'film', 'product', 'city', 'hello']);
  
  return (
    <>
      <header className="topbar">
        <h1 className="left">Explore</h1>
        <div style={{ flex: 1 }} />
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <Link href="/app/search" className="field" style={{ display: 'block', cursor: 'pointer', marginTop: 8 }}>
          <span className="field-label">Search</span>
          <span style={{ color: 'var(--t2)' }}>Search people, posts, and topics</span>
        </Link>
        
        <Card>
          <h3 style={{ marginTop: 0 }}>Trending Topics</h3>
          {trending.map(t => (
            <Row key={t} title={`#${t}`} href={`/app/tags/${t}`} showChevron />
          ))}
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Suggested People</h3>
          <p className="muted" style={{ fontSize: '.92em', margin: 0 }}>Use the search page to find and follow people.</p>
        </Card>
      </div>
    </>
  );
}
