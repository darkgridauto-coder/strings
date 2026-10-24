'use client';
import { useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Toggle } from '@/components/ui/Toggle';
import { Row } from '@/components/ui/Row';
import { useSetting } from '@/lib/useSetting';

export default function Page() {
  const [filters, setFilters] = useSetting('filtersOn', true);
  const [words, setWords] = useSetting<string[]>('hiddenWords', []);
  const [input, setInput] = useState('');

  function addWord() {
    const w = input.trim().toLowerCase();
    if (!w || words.includes(w)) return;
    setWords([...words, w]); setInput('');
  }
  function removeWord(w: string) { setWords(words.filter((x) => x !== w)); }

  return (
    <SettingsShell title="Hidden words & filters" back="/app/settings/privacy">
      <Row icon="filter" title="Comment filters" sub="Hide comments containing your words" trail={<Toggle checked={filters} onChange={setFilters} label="Comment filters" />} />
      <h3 style={{ marginTop: 20 }}>Your hidden words</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <label className="field" style={{ flex: 1, margin: 0 }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add a word or phrase" onKeyDown={(e) => e.key === 'Enter' && addWord()} /></label>
        <button className="btn btn-primary btn-sm" onClick={addWord}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {words.length === 0 ? <p className="muted">No hidden words yet.</p> : words.map((w) => (
          <span key={w} style={{ background: 'var(--bg-2)', padding: '6px 12px', borderRadius: 16, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '.9em' }}>
            {w} <button onClick={() => removeWord(w)} aria-label={`Remove ${w}`}>×</button>
          </span>
        ))}
      </div>
    </SettingsShell>
  );
}
