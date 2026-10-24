import { SettingsShell } from '@/components/settings/SettingsShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';

export default function Page() {
  return (
    <SettingsShell title="Blocked & restricted" back="/app/settings/privacy">
      <EmptyState icon="ban" title="No blocked accounts">Blocked and restricted accounts will appear here once blocking is backed by a server.</EmptyState>
      <Card>
        <strong>What blocking does</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>Blocked accounts can&apos;t see your profile, message you, or appear in your feed and search. Restricted accounts are limited quietly.</p>
      </Card>
    </SettingsShell>
  );
}
