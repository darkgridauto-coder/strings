import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AppShell } from '@/components/shell/AppShell';
import { IncomingCallListener } from '@/components/chat/IncomingCallListener';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = getSession();
  if (!session) redirect('/login');
  
  const user = await prisma.user.findUnique({ 
    where: { id: session.userId },
    select: { emailVerified: true } 
  });
  
  if (!user) redirect('/login');
  if (!user.emailVerified) redirect('/verify');

  return (
    <>
      <IncomingCallListener />
      <AppShell>{children}</AppShell>
    </>
  );
}
