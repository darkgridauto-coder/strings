'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

type Detail = {
  user: any;
  reportsAgainst: any[];
  recentPosts: any[];
  recentActions: any[];
};

export default function Page({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState('');

  function load() {
    fetch(`/api/admin/users/${params.id}`).then(r => r.json()).then(d => {
      if (d.ok) setData(d);
      else setErr(d.error || 'Failed to load');
    });
  }
  useEffect(() => { load(); }, [params.id]);

  async function patch(payload: Record<string, unknown>) {
    try {
      const r = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.ok) { showToast('Updated'); load(); }
      else showToast(d.error || 'Failed');
    } catch { showToast('Network error'); }
  }

  return (
    <>
      <Link href="/admin/users" className="muted" style={{ fontSize: '.9em' }}>← Back to users</Link>

      {err && <p style={{ color: 'var(--tx)', fontWeight: 600, marginTop: 12 }}>{err}</p>}
      {!data && !err && <p className="muted" style={{ marginTop: 12 }}>Loading…</p>}

      {data && (
        <>
          <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <b style={{ fontSize: '1.15em' }}>{data.user.displayName}</b>
                <div className="muted">@{data.user.handle} · {data.user.role}</div>
                <div className="muted" style={{ fontSize: '.85em', marginTop: 4 }}>{data.user.email}</div>
                <div className="muted" style={{ fontSize: '.85em' }}>
                  Joined {new Date(data.user.createdAt).toLocaleDateString()} ·
                  {' '}{data.user.emailVerified ? 'Email verified' : 'Email unverified'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="pill sm" onClick={() => patch({ emailVerified: !data.user.emailVerified })}>
                  {data.user.emailVerified ? 'Mark unverified' : 'Mark verified'}
                </button>
                <button className="pill sm" onClick={() => patch({ role: data.user.role === 'admin' ? 'user' : 'admin' })}>
                  {data.user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 16 }}>
              <Stat label="Posts" value={data.user._count.posts} />
              <Stat label="Followers" value={data.user._count.followers} />
              <Stat label="Following" value={data.user._count.following} />
              <Stat label="Comments" value={data.user._count.comments} />
              <Stat label="Status" value={data.user._count.statuses} />
            </div>
          </div>

          {data.user.verifications.length > 0 && (
            <Section title="Verification">
              {data.user.verifications.map((v: any, i: number) => (
                <Row key={i} left={v.tier} right={v.status} />
              ))}
            </Section>
          )}

          {data.user.subscriptions.length > 0 && (
            <Section title="Subscriptions">
              {data.user.subscriptions.map((s: any, i: number) => (
                <Row key={i} left={`${s.kind} · ${s.plan}`} right={s.status} />
              ))}
            </Section>
          )}

          {data.reportsAgainst.length > 0 && (
            <Section title="Reports against this user">
              {data.reportsAgainst.map((r: any) => (
                <div key={r.id} style={{ padding: '10px 0', borderTop: '1px solid var(--line)', fontSize: '.9em' }}>
                  <b>{r.reason.slice(0, 100)}</b>
                  <div className="muted" style={{ fontSize: '.85em' }}>{new Date(r.createdAt).toLocaleString()} · {r.status}</div>
                </div>
              ))}
            </Section>
          )}

          {data.recentPosts.length > 0 && (
            <Section title="Recent posts">
              {data.recentPosts.map((p: any) => (
                <Link key={p.id} href={`/app/posts/${p.id}`} style={{ display: 'block', padding: '10px 0', borderTop: '1px solid var(--line)', fontSize: '.9em' }}>
                  {p.body.slice(0, 100) || '(photo)'}
                  <div className="muted" style={{ fontSize: '.85em' }}>{new Date(p.createdAt).toLocaleString()}</div>
                </Link>
              ))}
            </Section>
          )}

          {data.recentActions.length > 0 && (
            <Section title="Recent admin actions">
              {data.recentActions.map((a: any) => (
                <Row key={a.id} left={a.action} right={new Date(a.createdAt).toLocaleDateString()} />
              ))}
            </Section>
          )}
        </>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 14, padding: '10px 12px' }}>
      <small className="muted">{label}</small>
      <div style={{ fontSize: '1.3em', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '1em', textTransform: 'none', letterSpacing: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderTop: '1px solid var(--line)', fontSize: '.9em' }}>
      <span>{left}</span>
      <span className="muted">{right}</span>
    </div>
  );
}
