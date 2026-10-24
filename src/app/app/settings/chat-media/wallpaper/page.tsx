'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { getGlobalWallpaper, setGlobalWallpaper, WallpaperPreset } from '@/lib/chatWallpaper';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';

export default function Page() {
  const { showToast } = useToast();
  const [preset, setPreset] = useState<WallpaperPreset>('none');

  useEffect(() => {
    setPreset(getGlobalWallpaper().preset);
  }, []);

  function save(p: WallpaperPreset) {
    setGlobalWallpaper({ preset: p });
    setPreset(p);
    showToast(`Default wallpaper: ${p}`);
  }

  const presets: [WallpaperPreset, string][] = [
    ['none', 'None'],
    ['paper', 'Paper'],
    ['dots', 'Dots'],
    ['gradient', 'Gradient'],
    ['dark', 'Dark'],
  ];

  return (
    <SettingsShell title="Default chat wallpaper" back="/app/settings/chat-media">
      <p className="muted">
        Applies to every DM that does not have its own wallpaper. Open a conversation → Settings → Chat wallpaper to override for that one chat.
      </p>
      <Card style={{ padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {presets.map(([k, label]) => (
            <button key={k} onClick={() => save(k)} style={{
              padding: 20, borderRadius: 16,
              border: preset === k ? '2px solid var(--tx)' : '1px solid var(--ln)',
              background: k === 'none' ? 'var(--bg)' :
                k === 'paper' ? 'repeating-linear-gradient(45deg, var(--b2) 0 10px, var(--bg) 10px 20px)' :
                k === 'dots' ? 'radial-gradient(var(--b3) 1px, transparent 1px) 0 0 / 20px 20px' :
                k === 'gradient' ? 'linear-gradient(135deg, #f5f5f5, #e7e7e7)' : '#0a0a0a',
              color: k === 'dark' ? '#fff' : 'var(--tx)',
              minHeight: 100, fontWeight: 600, fontSize: '.95em',
            }}>
              {label}
              {preset === k && <div style={{ marginTop: 6 }}><Icon name="check" size={16} /></div>}
            </button>
          ))}
        </div>
      </Card>
      <p className="muted" style={{ fontSize: '.85em', marginTop: 16 }}>
        Stored on this device only. Wallpaper is not synced across devices.
      </p>
    </SettingsShell>
  );
}
