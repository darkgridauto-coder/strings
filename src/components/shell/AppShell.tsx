import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { RightRail } from './RightRail';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-main">{children}</main>
      <aside className="rail"><RightRail /></aside>
      <TabBar />
    </div>
  );
}
