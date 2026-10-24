import { ReactNode } from 'react';

export function Badge({ children, variant }: { children: ReactNode, variant?: 'ok' | 'bad' | 'neutral' }) {
  const bg = variant === 'ok' ? 'var(--ok)' : variant === 'bad' ? 'var(--bad)' : 'var(--b3)';
  const color = variant === 'ok' || variant === 'bad' ? '#fff' : 'var(--tx)';
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 10, background: bg, color, fontSize: '.76rem', fontWeight: 600 }}>
      {children}
    </span>
  );
}

export function Table({ headers, rows, emptyMsg }: { headers: string[]; rows: ReactNode[][]; emptyMsg?: string }) {
  if (rows.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--t2)' }}>{emptyMsg || 'Nothing to show.'}</div>;
  }
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--ln)', borderRadius: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
        <thead>
          <tr style={{ background: 'var(--b2)' }}>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '11px 14px', color: 'var(--t2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--ln)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '11px 14px', verticalAlign: 'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KPI({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div style={{ background: 'var(--b2)', borderRadius: 18, padding: 16 }}>
      <small style={{ display: 'block', color: 'var(--t2)' }}>{label}</small>
      <b style={{ fontSize: '1.7rem', letterSpacing: '-.04em', display: 'block', margin: '2px 0' }}>{value}</b>
      {sub && <small style={{ color: 'var(--t2)' }}>{sub}</small>}
    </div>
  );
}
