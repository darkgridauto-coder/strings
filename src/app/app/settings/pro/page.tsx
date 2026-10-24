'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/Row';
import { Icon } from '@/components/ui/Icon';

type Sub = { plan: 'monthly' | 'annual'; status: 'active' | 'cancelled'; renewsAt: string } | null;

const PLANS = {
  monthly: { label: 'Monthly', price: '$4.99', per: 'month' },
  annual: { label: 'Annual', price: '$49.99', per: 'year', save: 'Save 16%' },
};

export default function Page() {
  const [sub, setSub] = useState<Sub>(null);
  const [active, setActive] = useState(false);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  function reload() {
    fetch('/api/pro/status').then((r) => r.json()).then((d) => {
      if (d.ok) { setSub(d.subscription); setActive(d.active); }
    }).finally(() => setLoaded(true));
  }
  useEffect(() => { reload(); }, []);

  async function subscribe() {
    setError(''); setBusy(true);
    try {
      const r = await fetch('/api/pro/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, kind: 'pro' }),
      });
      const d = await r.json();
      if (!d.ok) setError(d.error || 'Failed');
      else reload();
    } catch { setError('Network error'); }
    finally { setBusy(false); }
  }
  async function cancel() {
    setBusy(true);
    try { await fetch('/api/pro/cancel', { method: 'POST' }); reload(); }
    finally { setBusy(false); }
  }

  return (
    <SettingsShell title="Strings Pro" back="/app/settings">
      <Card style={{ textAlign: 'center', padding: '22px 18px' }}>
        <Icon name="crown" size={48} />
        <b style={{ display: 'block', fontSize: '1.2em', marginTop: 8 }}>Strings Pro</b>
        <small className="muted">Security and feed-control tools. Pro never changes your verification badge.</small>
      </Card>

      {!loaded ? null : active && sub ? (
        <>
          <Card>
            <Row title="Plan" sub={`${PLANS[sub.plan].label} · ${PLANS[sub.plan].price} per ${PLANS[sub.plan].per}`} />
            <Row title={sub.status === 'cancelled' ? 'Ends' : 'Renews on'} sub={new Date(sub.renewsAt).toLocaleDateString()} />
          </Card>
          {sub.status === 'active' && (
            <Button onClick={cancel} variant="outline" disabled={busy}>{busy ? 'Working…' : 'Cancel subscription'}</Button>
          )}
        </>
      ) : (
        <>
          <h3>Choose a plan</h3>
          <p className="muted">Demo pricing. No payment is taken in this build.</p>
          {(['annual', 'monthly'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setPlan(k)}
              style={{
                width: '100%', textAlign: 'left', margin: '8px 0',
                padding: 14, borderRadius: 18,
                border: plan === k ? '2px solid var(--tx)' : '1.5px solid var(--b3)',
                background: 'var(--bg)',
                display: 'flex', gap: 12, alignItems: 'center',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 11,
                border: '2px solid var(--tx)',
                display: 'grid', placeItems: 'center',
                background: plan === k ? 'var(--tx)' : 'transparent',
                color: plan === k ? 'var(--bg)' : 'transparent',
              }}>{plan === k ? <Icon name="check" size={13} /> : null}</span>
              <div style={{ flex: 1 }}>
                <b>{PLANS[k].label}</b>
                <small className="muted" style={{ display: 'block' }}>
                  {k === 'annual' ? `${PLANS[k].save} · billed once a year` : 'Billed every month'}
                </small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b>{PLANS[k].price}</b>
                <small className="muted" style={{ display: 'block' }}>per {PLANS[k].per}</small>
              </div>
            </button>
          ))}
          {error && <p style={{ fontWeight: 600, color: 'var(--tx)' }}>{error}</p>}
          <Button onClick={subscribe} disabled={busy} block>{busy ? 'Processing…' : `Start Strings Pro · ${PLANS[plan].price}`}</Button>
        </>
      )}

      <h3>Tools</h3>
      <Row icon="lock" title="Secure vault" sub="Encrypted notes (coming next batch)" href="/app/settings/pro/vault" showChevron />
      <Row icon="filter" title="Feed controls" sub="Weight topics (coming next batch)" href="/app/settings/pro/feed" showChevron />
      <Card>
        <small className="muted">Sign messages, creator payouts and escrow need external providers. Not part of this build.</small>
      </Card>
    </SettingsShell>
  );
}
