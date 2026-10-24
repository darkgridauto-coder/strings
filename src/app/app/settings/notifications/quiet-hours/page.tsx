'use client';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { useSetting } from '@/lib/useSetting';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Page() {
  const [enabled, setEnabled] = useSetting('qhOn', false);
  const [start, setStart] = useSetting('qhStart', '22:00');
  const [end, setEnd] = useSetting('qhEnd', '07:00');
  const [days, setDays] = useSetting<boolean[]>('qhDays', [true, true, true, true, true, false, false]);
  const toggleDay = (i: number) => setDays(days.map((d, j) => (i === j ? !d : d)));

  return (
    <SettingsShell title="Quiet hours" back="/app/settings/notifications">
      <p className="muted">Choose when eligible alerts are silenced.</p>
      <Row title="Enable quiet hours" trail={<Toggle checked={enabled} onChange={setEnabled} label="Quiet hours" />} />
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <label className="field" style={{ flex: 1 }}><span className="field-label">Start</span><input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="field" style={{ flex: 1 }}><span className="field-label">End</span><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      <h3>Repeat</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        {DAYS.map((d, i) => (
          <button key={i} onClick={() => toggleDay(i)} style={{
            width: 40, height: 40, borderRadius: 20, fontWeight: 600,
            border: '1px solid var(--bg-3)',
            background: days[i] ? 'var(--tx)' : 'transparent',
            color: days[i] ? 'var(--bg)' : 'var(--tx)',
          }}>{d}</button>
        ))}
      </div>
    </SettingsShell>
  );
}
