'use client';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { useSetting } from '@/lib/useSetting';

export default function Page() {
  const [visibility, setVisibility] = useSetting('privacyVis', 'Public');
  const [messaging, setMessaging] = useSetting('privacyMsg', 'Everyone');
  return (
    <SettingsShell title="Privacy" back="/app/settings">
      <div className="card"><strong>Your privacy, your choices</strong><p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>Changes are saved to your account immediately.</p></div>
      <label className="field">
        <span className="field-label">Profile visibility</span>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
          <option>Public</option><option>Followers only</option><option>Private</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Who can message you</span>
        <select value={messaging} onChange={(e) => setMessaging(e.target.value)}>
          <option>Everyone</option><option>People I follow</option><option>No one</option>
        </select>
      </label>
      <Row icon="ban" title="Blocked and restricted accounts" sub="Manage blocked accounts" href="/app/settings/privacy/blocked" showChevron />
      <Row icon="filter" title="Hidden words and filters" sub="Manage content filtering" href="/app/settings/privacy/filters" showChevron />
    </SettingsShell>
  );
}
