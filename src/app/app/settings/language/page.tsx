import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';

export default function Page() {
  return (
    <SettingsShell title="Language" back="/app/settings">
      <p className="muted">Only shipped interface languages are listed. User content is not translated automatically.</p>
      <div style={{ marginTop: 12 }}>
        <Row title="English" sub="Currently active" trail={<span style={{ fontSize: '.8em', background: 'var(--bg-3)', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>Selected</span>} />
        <Row title="Hausa" sub="Not yet available" trail={<span style={{ fontSize: '.8em', color: 'var(--tx-2)' }}>Coming soon</span>} />
        <Row title="Yorùbá" sub="Not yet available" trail={<span style={{ fontSize: '.8em', color: 'var(--tx-2)' }}>Coming soon</span>} />
        <Row title="Igbo" sub="Not yet available" trail={<span style={{ fontSize: '.8em', color: 'var(--tx-2)' }}>Coming soon</span>} />
      </div>
    </SettingsShell>
  );
}
