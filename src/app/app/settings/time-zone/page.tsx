'use client';
import { useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { useLocalSetting } from '@/lib/useLocalSetting';

const FALLBACK = ['Africa/Lagos', 'UTC', 'Europe/London', 'America/New_York', 'Africa/Accra', 'Africa/Nairobi'];
export default function Page() {
  const [tz, setTz] = useLocalSetting('strings-tz', 'Africa/Lagos');
  const [zones] = useState<string[]>(() => {
    try { return (Intl as any).supportedValuesOf?.('timeZone') || FALLBACK; } catch { return FALLBACK; }
  });
  let preview = '';
  try { preview = new Intl.DateTimeFormat('en', { timeZone: tz, timeStyle: 'short', dateStyle: 'medium' }).format(new Date()); } catch { preview = '—'; }
  return (
    <SettingsShell title="Time zone" back="/app/settings">
      <p className="muted">Choose how local times are displayed throughout Strings.</p>
      <label className="field">
        <span className="field-label">Current time zone</span>
        <select value={tz} onChange={(e) => setTz(e.target.value)}>
          {zones.map((z) => <option key={z}>{z}</option>)}
        </select>
      </label>
      <div className="card" style={{ marginTop: 16 }}>
        <small className="muted">Example timestamp</small>
        <p style={{ margin: '4px 0 0', fontSize: '1.2em', fontWeight: 600 }}>{preview}</p>
      </div>
    </SettingsShell>
  );
}
