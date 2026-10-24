'use client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Row } from '@/components/ui/Row';
import { HELP_TOPICS } from '@/lib/helpTopics';

export default function Page({ params }: { params: { i: string } }) {
  const topic = HELP_TOPICS[+params.i];
  if (!topic) notFound();

  return (
    <>
      <header className="topbar">
        <Link href="/app/help" className="ib" aria-label="Back">←</Link>
        <h1>{topic.title}</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <p className="muted">{topic.blurb}</p>
        {topic.items.map((it, j) => (
          <Card key={j}>
            <b style={{ display: 'block', marginBottom: 6 }}>{it.q}</b>
            <span style={{ color: 'var(--t2)', lineHeight: 1.6 }}>{it.a}</span>
          </Card>
        ))}
        <Card style={{ background: 'transparent', border: '1px dashed var(--ln)' }}>
          <b>Still stuck?</b>
          <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>Submit a report and the team will follow up.</p>
          <Row icon="help" title="Report a problem" href="/app/help/report" showChevron />
        </Card>
      </div>
    </>
  );
}
