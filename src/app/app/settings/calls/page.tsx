'use client';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { useLocalSetting } from '@/lib/useLocalSetting';

export default function Page() {
  const [ring, setRing] = useLocalSetting('strings-call-ring', true);
  const [video, setVideo] = useLocalSetting('strings-call-video', true);
  return (
    <SettingsShell title="Call preferences" back="/app/settings">
      <p className="muted">Control how incoming calls behave. Some preferences will be enforced by the call service.</p>
      <Row title="Ring for incoming calls" trail={<Toggle checked={ring} onChange={setRing} label="Ring" />} />
      <Row title="Start with video enabled" sub="Default for video calls" trail={<Toggle checked={video} onChange={setVideo} label="Video default" />} />
      <Row icon="mic" title="Device setup and permissions" sub="Microphone, camera, speaker" href="/app/calls/permissions" showChevron />
      <div className="card" style={{ marginTop: 16 }}>
        <strong>Calling is not connected yet</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>Signaling, media transport and WebRTC infrastructure are not implemented. Preferences save locally.</p>
      </div>
    </SettingsShell>
  );
}
