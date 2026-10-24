'use client';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { useSetting } from '@/lib/useSetting';

export default function Page() {
  const [preview, setPreview] = useSetting('mediaPreview', true);
  const [auto, setAuto] = useSetting('mediaAuto', false);
  const [receipts, setReceipts] = useSetting('mediaReceipts', true);
  return (
    <SettingsShell title="Chats & media" back="/app/settings">
      <p className="muted">Manage media and conversation preferences.</p>
      <h3>Media</h3>
      <Row title="Media previews" sub="Show previews of supported media" trail={<Toggle checked={preview} onChange={setPreview} label="Previews" />} />
      <Row title="Automatic downloads" sub="Download media automatically" trail={<Toggle checked={auto} onChange={setAuto} label="Auto download" />} />
      <h3>Conversation</h3>
      <Row title="Read receipts" sub="Control read-status sharing" trail={<Toggle checked={receipts} onChange={setReceipts} label="Read receipts" />} />
    </SettingsShell>
  );
}
