'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { Card } from '@/components/ui/Card';

export default function Page() {
  const [ua, setUa] = useState('this device');
  useEffect(() => { if (typeof navigator !== 'undefined') setUa(navigator.userAgent.split(') ')[0].replace(/^Mozilla\/5\.0 \(/, '')); }, []);
  return (
    <SettingsShell title="Active sessions" back="/app/settings/security">
      <p className="muted">Device details come from the current session only.</p>
      <Row icon="db" title="This device" sub={ua} trail={<span style={{ fontSize: '.8em', background: 'var(--bg-3)', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>Current</span>} />
      <Card>
        <strong>Sign out other sessions</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>No other sessions are recorded. Session revocation requires the auth backend.</p>
      </Card>
    </SettingsShell>
  );
}
