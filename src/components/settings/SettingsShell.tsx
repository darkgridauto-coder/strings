import type { ReactNode } from 'react';
export function SettingsShell({ title, back, children }: { title: string; back?: string; children: ReactNode }) {
  return (
    <>
      <header className="topbar">
        {back ? <a href={back} style={{ padding: 8, fontSize: 20 }} aria-label="Back">←</a> : <span style={{ width: 34 }} />}
        <h1 className={back ? '' : 'left'}>{title}</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">{children}</div>
    </>
  );
}
