'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/Row';
import { Icon } from '@/components/ui/Icon';

type Tier = 'identity' | 'professional' | 'organisation';
type Ver = { id: string; tier: Tier; status: 'pending' | 'verified' | 'rejected'; reason: string };
type Status = {
  verifications: Ver[];
  subscription: { plan: 'monthly' | 'annual'; status: 'active' | 'cancelled'; renewsAt: string } | null;
  verifiedTier: Tier | null;
};

const TIERS: { key: Tier; name: string; desc: string }[] = [
  { key: 'identity', name: 'Identity', desc: 'Government ID plus a live camera check confirm you are a real person.' },
  { key: 'professional', name: 'Professional', desc: 'A work or institution email, or a GitHub or portfolio link.' },
  { key: 'organisation', name: 'Organisation', desc: 'Official representation of a company, institution or brand.' },
];

const PLANS = {
  monthly: { label: 'Monthly', price: '$4.99', per: 'month' },
  annual: { label: 'Annual', price: '$49.99', per: 'year', save: 'Save 16%' },
};

export default function Page() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [pendingTier, setPendingTier] = useState<Tier | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function reload() {
    fetch('/api/verification/status').then((r) => r.json()).then((d) => { if (d.ok) setStatus(d); }).finally(() => setLoading(false));
  }
  useEffect(() => { reload(); }, []);

  async function subscribe() {
    setError(''); setBusy(true);
    try {
      const r = await fetch('/api/pro/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, kind: 'verify' }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Subscription failed'); return; }
      reload();
    } catch { setError('Network error'); }
    finally { setBusy(false); }
  }

  async function apply(tier: Tier) {
    setError(''); setPendingTier(tier); setBusy(true);
    try {
      const r = await fetch('/api/verification/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Application failed'); return; }
      reload();
    } catch { setError('Network error'); }
    finally { setBusy(false); setPendingTier(null); }
  }

  const hasPlan = status?.subscription?.status === 'active';
  const verified = status?.verifiedTier;

  return (
    <SettingsShell title="Verification" back="/app/settings">
      <p className="muted">Verification combines credential review with a paid plan. Reviewed by Strings administrators.</p>

      {/* Hero */}
      {verified ? (
        <Card style={{ textAlign: 'center', padding: '22px 18px' }}>
          <Icon name="shield" size={56} />
          <b style={{ display: 'block', fontSize: '1.2em', marginTop: 10 }}>
            {TIERS.find((t) => t.key === verified)?.name} verified
          </b>
          <small className="muted">This badge shows beside your name on your profile, posts and status.</small>
        </Card>
      ) : (
        <Card style={{ textAlign: 'center', padding: '22px 18px' }}>
          <Icon name="shield" size={56} />
          <b style={{ display: 'block', fontSize: '1.2em', marginTop: 10 }}>Get verified</b>
          <small className="muted">Verification combines a credential review with a monthly or annual plan. Separate from Strings Pro.</small>
        </Card>
      )}

      {/* Plan */}
      <h3>Verification plan</h3>
      {hasPlan ? (
        <Card>
          <Row title={`Plan: ${status?.subscription?.plan}`} sub={`Active · renews ${new Date(status?.subscription?.renewsAt || '').toLocaleDateString()}`} />
        </Card>
      ) : (
        <>
          <p className="muted">A paid plan is required before you can submit credentials. Demo pricing — no payment is taken.</p>
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
          <Button onClick={subscribe} disabled={busy} block>{busy ? 'Processing…' : `Subscribe · ${PLANS[plan].price}`}</Button>
        </>
      )}

      {/* Tiers */}
      <h3>Tiers</h3>
      {TIERS.map((t) => {
        const existing = status?.verifications.find((v) => v.tier === t.key);
        const locked = t.key !== 'identity' && !status?.verifications.find((v) => v.tier === 'identity' && v.status === 'verified');
        return (
          <Card key={t.key}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
              <Icon name="shield" size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block' }}>{t.name}</b>
                <small className="muted">{t.desc}</small>
              </div>
            </div>
            <Row title="Status" sub={existing ? existing.status[0].toUpperCase() + existing.status.slice(1) : 'Not started'} />
            {existing?.status === 'rejected' && existing.reason && (
              <p className="muted" style={{ fontSize: '.9em' }}>Reason: {existing.reason}</p>
            )}
            {!hasPlan && <small className="muted">Subscribe to a plan above first.</small>}
            {hasPlan && locked && <small className="muted">Complete Identity verification first.</small>}
            {hasPlan && !locked && (!existing || existing.status === 'rejected') && (
              <Button size="sm" variant="outline" onClick={() => apply(t.key)} disabled={busy}>
                {pendingTier === t.key ? 'Submitting…' : existing ? 'Apply again' : 'Start'}
              </Button>
            )}
            {existing?.status === 'pending' && <small className="muted">Under review by an administrator.</small>}
          </Card>
        );
      })}

      <Card style={{ marginTop: 16 }}>
        <b>Badge guide</b>
        <Row title="Identity verified" sub="A real person, confirmed by ID and a live check." />
        <Row title="Verified professional" sub="Identity plus a professional credential." />
        <Row title="Verified organisation" sub="Official representation of an organisation." />
        <Row title="Official" sub="Reserved for Strings administration." />
      </Card>
    </SettingsShell>
  );
}
