type Props = { id: string; title: string; note?: string };

export function RoutePlaceholder({ id, title, note }: Props) {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
        STRINGS
      </p>
      <h1 style={{ fontSize: '1.9em', letterSpacing: '-.03em', margin: '8px 0 4px' }}>{title}</h1>
      <p style={{ color: 'var(--tx-2)', margin: '0 0 16px' }}>
        Screen ID: <code>{id}</code>
      </p>
      <div style={{
        border: '1px solid var(--line)',
        background: 'var(--bg-2)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        fontSize: '.92em',
        color: 'var(--tx-2)',
        marginBottom: 24,
      }}>
        Route is wired. UI, data, and interactions are built in a later batch.
      </div>
      {note ? <p style={{ margin: '0 0 24px' }}>{note}</p> : null}
      <p style={{ marginTop: 24 }}><a href="/">← Home</a></p>
    </main>
  );
}
