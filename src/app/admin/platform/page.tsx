'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export default function Page() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<any>({ signups: '1', posting: '1', verif: '1', pro: '1', banner: '' });

  useEffect(() => {
    fetch('/api/admin/platform')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { if (d.ok) setSettings(d.platform); })
    .catch(() => console.error('Failed to load platform settings'));
  }, []);

  async function toggle(key: string) {
    const val = settings[key] === '1' ? '0' : '1';
    await fetch('/api/admin/platform', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: val === '1' }) });
    setSettings({ ...settings, [key]: val });
    showToast('Updated');
  }

  return (
    <>
      <h2 style={{ margin: '0 0 20px' }}>Platform settings</h2>
      <p style={{ color: 'var(--t2)', marginBottom: 16 }}>These switches are read live by the Strings app.</p>
      
      <div style={{ background: 'var(--b2)', borderRadius: 20, padding: 18, maxWidth: 700 }}>
        {[['signups', 'New sign-ups', 'Allow people to create accounts'], ['posting', 'Posting', 'Allow users to publish posts'], ['verif', 'Verification plans', 'Allow new verification subscriptions'], ['pro', 'Strings Pro', 'Allow new Pro subscriptions']].map(([k, l, d]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--ln)' }}>
            <div>
              <b style={{ color: 'var(--tx)' }}>{l}</b>
              <div style={{ color: 'var(--t2)', fontSize: '.85em' }}>{d}</div>
            </div>
            <button onClick={() => toggle(k)} style={{ padding: '4px 12px', borderRadius: 12, background: settings[k] === '1' ? 'var(--tx)' : 'var(--b3)', color: settings[k] === '1' ? 'var(--bg)' : 'var(--tx)', border: 0, fontWeight: 600, cursor: 'pointer', minWidth: 60 }}>
              {settings[k] === '1' ? 'On' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
