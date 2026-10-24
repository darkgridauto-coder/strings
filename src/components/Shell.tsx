'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/shell/Sidebar';
import { RightRail } from '@/components/shell/RightRail';
import { TabBar } from '@/components/shell/TabBar';
import { SheetProvider } from '@/components/ui/Sheet';
import { SocketProvider } from '@/components/chat/SocketProvider';
import { UserProvider } from '@/components/UserProvider';
import { IncomingCallListener } from '@/components/chat/IncomingCallListener';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const solo = pathname === '/' || /^\/(login|signup|verify|account|onboarding|legal|guidelines)/.test(pathname);
  
  return (
    <SocketProvider>
      <UserProvider>
        <SheetProvider>
            <IncomingCallListener />
            <div id="app" className={solo ? 'solo' : ''}>
              <Sidebar />
              <main id="main">{children}</main>
              <RightRail />
              <TabBar />
            </div>
        </SheetProvider>
      </UserProvider>
    </SocketProvider>
  );
}
