'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string; handle: string; displayName: string;
  avatar: string; cover: string; bio: string;
  isPrivate: boolean; twoFactorEnabled?: boolean; emailVerified?: boolean;
  verifiedTier?: string; email?: string; createdAt?: string;
  settings?: Record<string, any>;
};

type Ctx = {
  user: User | null;
  refresh: () => Promise<void>;
  patchUser: (updates: Partial<User>) => Promise<void>;
};

const Ctx = createContext<Ctx>({ user: null, refresh: async () => {}, patchUser: async () => {} });

export function useUser() { return useContext(Ctx); }

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function refresh() {
    try {
      const r = await fetch('/api/users/me');
      const d = await r.json();
      if (d.ok) setUser(d.user);
    } catch {}
  }

  async function patchUser(updates: Partial<User>) {
    // Optimistic update
    setUser(prev => prev ? { ...prev, ...updates, settings: updates.settings ? { ...prev.settings, ...updates.settings } : prev.settings } : null);
    
    try {
      const r = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const d = await r.json();
      if (d.ok) setUser(d.user);
      else refresh(); // Revert on error
    } catch { refresh(); }
  }

  useEffect(() => { refresh(); }, []);

  return <Ctx.Provider value={{ user, refresh, patchUser }}>{children}</Ctx.Provider>;
}
