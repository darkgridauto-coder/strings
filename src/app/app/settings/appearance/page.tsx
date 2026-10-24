'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';

type Theme = 'light' | 'dark' | 'oled';

export default function Page() {
  const [theme, setTheme] = useState<Theme>('light');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    try {
      const t = localStorage.getItem('strings-theme');
      if (t) setTheme(JSON.parse(t) as Theme);
      const s = localStorage.getItem('strings-font-scale');
      if (s) setScale(JSON.parse(s) as number);
    } catch {}
  }, []);

  function applyTheme(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('strings-theme', JSON.stringify(t)); } catch {}
  }
  function applyScale(s: number) {
    setScale(s);
    document.documentElement.style.fontSize = 16 * s + 'px';
    try { localStorage.setItem('strings-font-scale', JSON.stringify(s)); } catch {}
  }

  const themes: [Theme, string, string][] = [['light', 'Light', '#fff'], ['dark', 'Dark', '#161616'], ['oled', 'OLED', '#000']];

  return (
    <SettingsShell title="Appearance" back="/app/settings">
      <p className="muted">Personalize how Strings looks. Changes save to this device.</p>
      <h3 style={{ marginTop: 20 }}>Theme</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {themes.map(([key, label, color]) => (
          <button key={key} onClick={() => applyTheme(key)} style={{
            padding: 10, borderRadius: 16, fontWeight: 600,
            border: theme === key ? '2px solid var(--tx)' : '1.5px solid var(--bg-3)',
            background: 'var(--bg)',
          }}>
            <span style={{ display: 'block', height: 50, borderRadius: 8, marginBottom: 6, background: color, border: '1px solid var(--bg-3)' }} />
            {label}
          </button>
        ))}
      </div>
      <h3 style={{ marginTop: 24 }}>Text size</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '.9em' }}>A</span>
        <input type="range" min="0.9" max="1.3" step="0.05" value={scale} onChange={(e) => applyScale(parseFloat(e.target.value))} style={{ flex: 1, accentColor: 'var(--tx)' }} />
        <span style={{ fontSize: '1.2em' }}>A</span>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <strong>Preview</strong>
        <p className="muted" style={{ marginTop: 6 }}>Your feed, messages, and settings use the selected appearance.</p>
      </div>
    </SettingsShell>
  );
}
