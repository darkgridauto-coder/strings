'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { loadWeights, saveWeights, TOPICS, Topic, Mode } from '@/lib/feedWeights';

export default function Page() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('standard');
  const [weights, setWeights] = useState<Record<Topic, number>>({ design: 1, film: 1, product: 1, city: 1, life: 1, tech: 1 });

  useEffect(() => { const r = loadWeights(); setMode(r.mode); setWeights(r.weights); }, []);
  function setW(t: Topic, v: number) { setWeights({ ...weights, [t]: v }); }
  function save() { saveWeights(mode, weights); showToast('Feed preferences saved'); }

  return (
    <SettingsShell title="Feed controls" back="/app/settings/pro">
      <p className="muted">Standard is chronological. Custom ranks posts by keyword-matched topic weights. No algorithm, no filtering — just re-ordering.</p>
      <div className="seg">
        <button className={mode === 'standard' ? 'on' : ''} onClick={() => setMode('standard')}>Standard</button>
        <button className={mode === 'custom' ? 'on' : ''} onClick={() => setMode('custom')}>Custom topics</button>
      </div>
      <h3>Topic weights</h3>
      {TOPICS.map((t) => (
        <div key={t} className="row" style={{ cursor: 'default' }}>
          <div className="row-body"><b>{t}</b></div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['Less', 0], ['Normal', 1], ['More', 2]] as const).map(([label, val]) => (
              <button key={label} className={`pill sm ${weights[t] === val ? 'on' : ''}`} onClick={() => setW(t, val)}>{label}</button>
            ))}
          </div>
        </div>
      ))}
      <Button onClick={save} block>Save preferences</Button>
    </SettingsShell>
  );
}
