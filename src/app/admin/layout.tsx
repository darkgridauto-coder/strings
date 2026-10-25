import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const s = await getSession();
  if (!s) redirect('/login');
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { role: true, staffRole: true },
  });
  if (!user || (user.role !== 'admin' && !user.staffRole)) {
    return (
      <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <h1 style={{ fontSize: '1.5em', fontWeight: 700 }}>Restricted area</h1>
          <p style={{ color: 'var(--tx-2)', marginTop: 8 }}>This section is for authorised staff only.</p>
          <Link href="/app" className="pill on" style={{ display: 'inline-block', marginTop: 20, padding: '10px 18px', borderRadius: 12, textDecoration: 'none' }}>Back to app</Link>
        </div>
      </main>
    );
  }
  return <AdminShell>{children}</AdminShell>;
}
