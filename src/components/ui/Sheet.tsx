'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';

type Ctx = { openSheet: (content: ReactNode) => void; closeSheet: () => void };
const SheetCtx = createContext<Ctx | null>(null);

export function useSheet() {
  const c = useContext(SheetCtx);
  if (!c) throw new Error('useSheet must be used inside SheetProvider');
  return c;
}

export function SheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const triggerRef = useRef<Element | null>(null);

  const openSheet = useCallback((c: ReactNode) => {
    triggerRef.current = typeof document !== 'undefined' ? document.activeElement : null;
    setContent(c);
    setOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setOpen(false);
    // Restore focus to the trigger for accessibility.
    requestAnimationFrame(() => {
      const el = triggerRef.current as HTMLElement | null;
      if (el && typeof el.focus === 'function') el.focus();
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeSheet(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeSheet]);

  return (
    <SheetCtx.Provider value={{ openSheet, closeSheet }}>
      {children}
      <div className={'scrim' + (open ? ' on' : '')} onClick={closeSheet} aria-hidden="true" />
      <div className={'sheet' + (open ? ' on' : '')} role="dialog" aria-modal="true" aria-hidden={!open}>
        <span className="sheet-grab" aria-hidden="true" />
        {content}
      </div>
    </SheetCtx.Provider>
  );
}
