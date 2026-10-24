import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { Card } from '@/components/ui/Card';

export default function Page() {
  return (
    <SettingsShell title="Password & security" back="/app/settings">
      <Card>
        <strong>Protect your account</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>Review your account protection options.</p>
      </Card>
      <Row icon="key" title="Change password" sub="Update your password" href="/account/reset" showChevron />
      <Row icon="phone" title="Two-factor authentication" sub="Additional sign-in factor" href="/app/settings/security/2fa" showChevron />
      <Row icon="db" title="Active sessions" sub="Review signed-in devices" href="/app/settings/security/sessions" showChevron />
      <Row icon="shield" title="Account recovery" sub="Available recovery methods" href="/account/recovery" showChevron />
      <Card>
        <strong>Security activity</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>Actual signed-in sessions and events will appear here once the auth backend exists. Nothing is currently recorded.</p>
      </Card>
    </SettingsShell>
  );
}
