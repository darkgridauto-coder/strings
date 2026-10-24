'use client';
import { useEffect } from 'react';

export function SWRegister() {
  useEffect(() => {
    // Never register the service worker in development.
    // It intercepts every navigation, caches stale chunks, and makes
    // every page feel slow because SW updates require two reloads.
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[SW] registered at', reg.scope);
        })
        .catch((e) => {
          console.warn('[SW] registration failed', e);
        });
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
