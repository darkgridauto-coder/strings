'use client';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { useLocalSetting } from '@/lib/useLocalSetting';

const REGIONS: Record<string, string> = { 'Nigeria': 'en-NG', 'United States': 'en-US', 'United Kingdom': 'en-GB' };

export default function Page() {
  const [region, setRegion] = useLocalSetting('strings-region', 'Nigeria');
  const locale = REGIONS[region] || 'en-US';
  const now = new Date();
  return (
    <SettingsShell title="Region" back="/app/settings">
      <p className="muted">Choose regional display preferences for dates and numbers.</p>
      <label className="field">
        <span className="field-label">Region</span>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {Object.keys(REGIONS).map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <h3>Preview</h3>
      <Row title="Date" trail={<b>{new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(now)}</b>} />
      <Row title="Number" trail={<b>{new Intl.NumberFormat(locale).format(1234.56)}</b>} />
      <Row title="Time" trail={<b>{new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(now)}</b>} />
      <Row icon="clock" title="Time zone" sub="Separate from region" href="/app/settings/time-zone" showChevron />
    </SettingsShell>
  );
}
