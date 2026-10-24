'use client';
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

type Ctx = { showToast: (msg: string) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast must be used inside ToastProvider');
  return c;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((m: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(m);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className={'toast' + (msg ? ' on' : '')} role="status" aria-live="polite">
        {msg || ''}
      </div>
    </ToastCtx.Provider>
  );
}
