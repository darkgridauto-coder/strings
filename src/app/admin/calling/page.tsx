'use client';

const ROWS: [string, string][] = [
  ['One-to-one voice', 'No data: not connected'],
  ['One-to-one video', 'No data: not connected'],
  ['Group voice', 'No data: not connected'],
  ['Group video', 'No data: not connected'],
];

export default function Page() {
  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Voice &amp; video</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Calls in Strings are simulated on the device. There is no call server, so the admin panel
        has <b>no real call, quality or connectivity data</b> to show, and none is invented. It also
        provides no way to join or record calls.
      </p>

      <div style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 18, maxWidth: 620 }}>
        {ROWS.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              padding: '10px 0',
              borderTop: '1px solid var(--line)',
              fontSize: '.92em',
            }}
          >
            <span>{label}</span>
            <span style={{ color: 'var(--tx-2)', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-2)', margin: '22px 0 10px' }}>
        Needed to enable this module
      </h3>
      <div style={{ background: 'var(--bg-2)', borderRadius: 20, padding: 18, maxWidth: 620, fontSize: '.92em', lineHeight: 1.6 }}>
        A signalling and media service (for example WebRTC with TURN servers), call-event
        logging, and a metrics pipeline. Once those exist, this page can show setup failures,
        quality scores and incident trends from real metadata.
      </div>

      <div style={{ borderLeft: '3px solid var(--tx)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: '0 12px 12px 0', marginTop: 14, fontSize: '.9em' }}>
        <b>Honest status:</b> the CALL UI in <code>/app/messages/[h]</code> is a simulated ring —
        it never opens a media stream. Wiring this page requires LiveKit credentials in <code>.env</code>.
      </div>
    </>
  );
}
