'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const pathname = usePathname();
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('strings.pwa.dismissed') === '1') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !evt) return null;
  if (pathname.startsWith('/admin')) return null;

  async function install() {
    if (!evt) return;
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      setVisible(false);
      setEvt(null);
      if (outcome === 'accepted') {
        console.log('[PWA] installed');
      } else {
        dismiss();
      }
    } catch {
      setVisible(false);
    }
  }

  function dismiss() {
    try { localStorage.setItem('strings.pwa.dismissed', '1'); } catch {}
    setVisible(false);
    setEvt(null);
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(90px + env(safe-area-inset-bottom))',
        maxWidth: 460,
        margin: '0 auto',
        background: 'var(--tx)',
        color: 'var(--bg)',
        borderRadius: 20,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        zIndex: 79,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: '.95em' }}>Install Strings</b>
        <small style={{ fontSize: '.78em', opacity: 0.75 }}>
          Full-screen launch, home-screen icon.
        </small>
      </div>
      <button
        onClick={install}
        style={{
          background: 'var(--bg)',
          color: 'var(--tx)',
          border: 0,
          borderRadius: 12,
          padding: '8px 14px',
          fontWeight: 700,
          fontSize: '.85em',
          cursor: 'pointer',
        }}
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          color: 'inherit',
          border: 0,
          padding: 6,
          cursor: 'pointer',
          opacity: 0.7,
        }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
