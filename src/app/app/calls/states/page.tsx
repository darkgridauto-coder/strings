import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const STATES = [
  ['CALL-01', 'Incoming call'],
  ['CALL-02', 'Outgoing / ringing'],
  ['CALL-03', 'Active voice call'],
  ['CALL-04', 'Active video call'],
  ['CALL-05', 'Call outcome'],
  ['CALL-08', 'Group call setup'],
  ['CALL-09', 'Active group voice call'],
  ['CALL-10', 'Active group video call'],
  ['CALL-11', 'Group participant management'],
];

export default function Page() {
  return (
    <>
      <header className="topbar"><a href="/app/settings/calls" style={{ padding: 8, fontSize: 20 }} aria-label="Back">←</a><h1>Call overlay states</h1><div className="topbar-actions" /></header>
      <div className="page">
        <p className="muted">These states are overlay-only. They will render as runtime overlays, not standalone pages, once real calling exists.</p>
        <Card>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {STATES.map(([id, label]) => (
              <li key={id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <code>{id}</code> — {label}
              </li>
            ))}
          </ul>
        </Card>
        <p className="muted" style={{ fontSize: '.85em', marginTop: 16 }}>
          <strong>Not implemented:</strong> signaling, media transport, group layouts, participant management, call outcomes, and events in conversations/notifications. Selecting a call service provider and defining call security are prerequisites.
        </p>
        <p><Link href="/">← Home</Link></p>
      </div>
    </>
  );
}
