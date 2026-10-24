'use client';
import { useEffect } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { useLocalSetting } from '@/lib/useLocalSetting';

export default function Page() {
  const [hc, setHc] = useLocalSetting('strings-hc', false);
  const [rm, setRm] = useLocalSetting('strings-rm', false);
  const [focus, setFocus] = useLocalSetting('strings-focus', true);

  useEffect(() => {
    document.documentElement.setAttribute('data-hc', hc ? '1' : '0');
  }, [hc]);
  useEffect(() => {
    document.documentElement.setAttribute('data-rm', rm ? '1' : '0');
  }, [rm]);

  return (
    <SettingsShell title="Accessibility" back="/app/settings">
      <p className="muted">Adjust display and motion preferences. Changes apply immediately.</p>
      <Row icon="eye" title="Contrast" sub="Improve visual separation" trail={<Toggle checked={hc} onChange={setHc} label="Contrast" />} />
      <Row icon="help" title="Reduce motion" sub="Reduce non-essential animation" trail={<Toggle checked={rm} onChange={setRm} label="Reduce motion" />} />
      <Row icon="eye" title="Visible focus" sub="Show clear keyboard focus" trail={<Toggle checked={focus} onChange={setFocus} label="Focus" />} />
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: '1.3em' }}>Preview</h2>
        <p className="muted">This text responds to your chosen preferences.</p>
      </div>
    </SettingsShell>
  );
}
