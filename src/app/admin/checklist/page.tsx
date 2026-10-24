'use client';

type Row = [string, 'ok' | 'warn' | 'bad', string];

const ROWS: Row[] = [
  ['Admin sign-in + admin-only guard',        'ok',   'Server check in layout.tsx'],
  ['Verified-seal display (posts + profile)', 'ok',   'VerifiedSeal renders from user.verifiedTier'],
  ['Admin panel foundation',                  'ok',   'Overview / Users / Reports / Content / Verification / Subscriptions / Announcements / Platform / Audit'],
  ['Email verification via Brevo',            'ok',   'BREVO_API_KEY loaded into custom server'],
  ['Platform flags gate signup + posting',    'ok',   'isEnabled() checks /api/posts and /api/auth/register'],
  ['Suspension filters feeds + blocks posting','ok',  'author.suspended filter'],
  ['Messages — send / file / voice / receipts','ok',  'Socket.IO + readAt column'],
  ['Message deduplication',                   'ok',   'ID + content + 2s window fallback'],
  ['New admin shell (4 groups, 18 modules)',  'ok',   'This batch — Phase A1'],
  ['Analytics page',                          'bad',  'Requires /api/admin/analytics — Phase A2'],
  ['Guideline review + strikes',              'bad',  'Requires Post.reviewedAt/Decision/Cats — Phase A2'],
  ['Messaging admin (privacy counts only)',   'bad',  'Requires /api/admin/messaging — Phase A2'],
  ['Support tickets + assignment',            'bad',  'Requires SupportTicket model — Phase B'],
  ['Health & incidents',                      'bad',  'Requires Incident model — Phase B'],
  ['Privacy requests (DSAR)',                 'bad',  'Requires PrivacyRequest model — Phase B'],
  ['Staff & roles (5-role RBAC + passcode)',  'bad',  'Requires Staff model — Phase B'],
  ['Reports: severity / assignee / notes',    'warn', 'Basic list works; rich case fields — Phase C'],
  ['Verification: evidence + plan tracking',  'warn', 'Approve / decline works; evidence capture — Phase C'],
  ['Content: removed tab + restore',          'warn', 'Delete works; restore needs soft-delete — Phase C'],
  ['Users: suspend / restore / notes / badges','warn','Role toggle works; suspend UI — Phase C'],
  ['Audit & security: sign-in history',       'warn', 'Action log works; login history — Phase C'],
  ['Real calling (WebRTC / LiveKit)',         'bad',  'Needs LIVEKIT_URL/API_KEY/SECRET in .env'],
  ['End-to-end encryption for DMs',           'bad',  'Body stored plaintext; needs E2EE design phase'],
  ['Draft / scheduled posts',                 'bad',  'Post.isDraft/scheduledFor exist; UI not wired'],
  ['Poll / quote / repost display',           'warn', 'Schema has fields; composer wires poll on create'],
  ['Automated tests',                         'warn', 'Data-layer smoke test only'],
];

const CHIP: Record<Row[1], { bg: string; fg: string }> = {
  ok:   { bg: '#0a7a3d', fg: '#fff' },
  warn: { bg: 'var(--bg-3)', fg: 'var(--tx)' },
  bad:  { bg: '#b3261e', fg: '#fff' },
};
const LABEL: Record<Row[1], string> = { ok: 'Verified complete', warn: 'In progress', bad: 'Blocked' };

export default function Page() {
  return (
    <>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', letterSpacing: '-.03em' }}>Build checklist</h2>
      <p style={{ color: 'var(--tx-2)', marginBottom: 14 }}>
        Every module with its real status. Nothing is marked &quot;complete&quot; that hasn&apos;t been
        built and verified end-to-end.
      </p>
      <div style={{ border: '1px solid var(--line)', borderRadius: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', textAlign: 'left' }}>
              <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tx-2)' }}>Module</th>
              <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tx-2)' }}>Status</th>
              <th style={{ padding: '11px 14px', fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--tx-2)' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([name, status, note]) => (
              <tr key={name} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '11px 14px', fontWeight: 600 }}>{name}</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 10,
                    fontSize: '.76rem',
                    fontWeight: 600,
                    background: CHIP[status].bg,
                    color: CHIP[status].fg,
                  }}>
                    {LABEL[status]}
                  </span>
                </td>
                <td style={{ padding: '11px 14px', color: 'var(--tx-2)' }}>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
