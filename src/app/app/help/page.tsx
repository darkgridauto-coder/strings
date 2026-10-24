'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Row } from '@/components/ui/Row';
import { Icon, IconName } from '@/components/ui/Icon';
import { HELP_TOPICS } from '@/lib/helpTopics';

export default function Page() {
  const [q, setQ] = useState('');
  const filtered = HELP_TOPICS.filter((t) =>
    q.trim() ? (t.title + t.blurb + t.items.map((i) => i.q + i.a).join(' ')).toLowerCase().includes(q.toLowerCase()) : true
  );

  return (
    <>
      <header className="topbar"><span style={{ width: 42 }} /><h1 className="left">Help center</h1><div className="topbar-actions" /></header>
      <div className="page">
        <h2 style={{ fontSize: '1.6em', marginTop: 0 }}>How can we help?</h2>
        <p className="muted">Search the guides or browse by topic.</p>
        <label className="field">
          <span className="field-label">Search help articles</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
        </label>

        <h3>Browse by topic</h3>
        <Card style={{ padding: 8 }}>
          {filtered.map((t, i) => (
            <Link key={i} href={`/app/help/t/${i}`} className="row" style={{ borderBottom: 0 }}>
              <Icon name={t.icon as IconName} />
              <div className="row-body">
                <span className="row-title">{t.title}</span>
                <span className="row-sub">{t.blurb}</span>
              </div>
              <Icon name="chevron" size={16} />
            </Link>
          ))}
          {filtered.length === 0 && <p className="muted" style={{ padding: 16 }}>No articles match your search.</p>}
        </Card>

        <h3>Still need help?</h3>
        <Card>
          <b>Contact support</b>
          <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>
            Report a problem and the team will follow up.
          </p>
          <Link href="/app/help/report" className="btn o" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 12 }}>Report a problem</Link>
        </Card>
      </div>
    </>
  );
}
