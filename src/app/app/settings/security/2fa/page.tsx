'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

type SetupData = { secret: string; qrDataUrl: string };

export default function Page() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<{ enabled: boolean; backupCodesRemaining: number } | null>(null);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [password, setPassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [busy, setBusy] = useState(false);

  function reload() {
    fetch('/api/2fa/status').then((r) => r.json()).then((d) => { if (d.ok) setStatus({ enabled: d.enabled, backupCodesRemaining: d.backupCodesRemaining }); });
  }
  useEffect(() => { reload(); }, []);

  async function startSetup() {
    setBusy(true);
    try {
      const r = await fetch('/api/2fa/setup', { method: 'POST' });
      const d = await r.json();
      if (d.ok) { setSetup({ secret: d.secret, qrDataUrl: d.qrDataUrl }); }
      else showToast(d.error || 'Setup failed');
    } finally { setBusy(false); }
  }

  async function enable() {
    if (!/^\d{6}$/.test(code)) return showToast('Enter the 6-digit code');
    setBusy(true);
    try {
      const r = await fetch('/api/2fa/enable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const d = await r.json();
      if (d.ok) {
        setBackupCodes(d.backupCodes);
        setSetup(null); setCode('');
        showToast('2FA enabled');
        reload();
      } else showToast(d.error || 'Verification failed');
    } finally { setBusy(false); }
  }

  async function disable() {
    if (!password || !disableCode) return showToast('Enter password and current code');
    setBusy(true);
    try {
      const r = await fetch('/api/2fa/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, code: disableCode }) });
      const d = await r.json();
      if (d.ok) { showToast('2FA disabled'); setPassword(''); setDisableCode(''); reload(); }
      else showToast(d.error || 'Failed to disable');
    } finally { setBusy(false); }
  }

  if (backupCodes) {
    return (
      <SettingsShell title="Two-factor authentication" back="/app/settings/security">
        <Card>
          <b>Save your backup codes</b>
          <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>
            Each code can be used once if you lose access to your authenticator app. Store them somewhere safe. They will not be shown again.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'monospace', marginTop: 16 }}>
            {backupCodes.map((c) => (
              <div key={c} style={{ padding: 8, background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>{c}</div>
            ))}
          </div>
          <Button onClick={() => { setBackupCodes(null); }} block>I have saved my codes</Button>
        </Card>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell title="Two-factor authentication" back="/app/settings/security">
      {!status && <p className="muted">Loading…</p>}

      {status && !status.enabled && !setup && (
        <Card>
          <b>2FA is not enabled</b>
          <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>
            Add a second factor (TOTP authenticator app) so a stolen password alone can&apos;t sign in.
          </p>
          <Button onClick={startSetup} disabled={busy} block>{busy ? 'Starting…' : 'Start setup'}</Button>
        </Card>
      )}

      {setup && (
        <Card>
          <b>Scan this QR code</b>
          <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>
            Use Google Authenticator, Authy, 1Password, or any TOTP app. Or enter the secret manually:
          </p>
          <div style={{ textAlign: 'center', margin: '12px 0' }}>
            <img src={setup.qrDataUrl} alt="QR code" style={{ background: '#fff', padding: 8, borderRadius: 12 }} />
          </div>
          <Field label="Secret (manual entry)">
            <input readOnly value={setup.secret} onFocus={(e) => e.target.select()} />
          </Field>
          <Field label="Enter the 6-digit code to confirm">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" autoComplete="one-time-code" />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={enable} disabled={busy} block>{busy ? 'Verifying…' : 'Enable 2FA'}</Button>
            <Button onClick={() => { setSetup(null); setCode(''); }} variant="outline">Cancel</Button>
          </div>
        </Card>
      )}

      {status && status.enabled && (
        <>
          <Card>
            <b>2FA is enabled</b>
            <p className="muted" style={{ marginTop: 6, fontSize: '.9em' }}>
              Backup codes remaining: {status.backupCodesRemaining}
            </p>
          </Card>
          <h3>Disable 2FA</h3>
          <Card>
            <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            <Field label="Current 6-digit code"><input value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" /></Field>
            <Button onClick={disable} disabled={busy} variant="outline" block>{busy ? 'Working…' : 'Disable 2FA'}</Button>
          </Card>
        </>
      )}
    </SettingsShell>
  );
}
