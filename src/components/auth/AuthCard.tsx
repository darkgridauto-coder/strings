import type { ReactNode } from 'react';
export function AuthCard({ step, title, subtitle, children }: { step: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <p className="auth-brand">{step}</p>
        <h1 style={{ marginBottom: 6 }}>{title}</h1>
        {subtitle ? <p className="muted" style={{ marginBottom: 24 }}>{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
