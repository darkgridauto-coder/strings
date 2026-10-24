'use client';
export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string }[]; active: T; onChange: (k: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: 22, borderBottom: '1px solid var(--line)', marginTop: 16 }}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: '11px 2px', fontWeight: 600, position: 'relative',
          color: active === t.key ? 'var(--tx)' : 'var(--tx-2)',
        }}>
          {t.label}
          {active === t.key ? <span style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, background: 'var(--tx)' }} /> : null}
        </button>
      ))}
    </div>
  );
}
