'use client';
import type { ReactNode } from 'react';
import { WelcomeHero } from '@/components/WelcomeHero';

export function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <div className="auth-split">
      <WelcomeHero />
      <div className="form-pane">
        <div className="auth-card fresh">{children}</div>
      </div>
    </div>
  );
}
