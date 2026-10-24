import Link from 'next/link';
export function AdminGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ padding: '12px 16px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', fontSize: '.9em' }}>
        <strong>Administration</strong> · Restricted area. Server-side authorization is required before real staff access is allowed.
        {' · '}<Link href="/app/settings">Exit to app</Link>
      </div>
      {children}
    </>
  );
}
