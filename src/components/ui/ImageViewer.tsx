'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type Show = (url: string, alt?: string) => void;
let showViewer: Show | null = null;

export function ImageViewer() {
  const [img, setImg] = useState<{ url: string; alt?: string } | null>(null);

  useEffect(() => {
    showViewer = (url, alt) => setImg({ url, alt });
    return () => { showViewer = null; };
  }, []);

  useEffect(() => {
    if (!img) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setImg(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [img]);

  if (!img) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={img.alt || 'Image'}
      onClick={() => setImg(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(0,0,0,.9)',
        display: 'grid', placeItems: 'center', padding: 24,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setImg(null); }}
        aria-label="Close image"
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 44, height: 44, borderRadius: 22,
          background: 'rgba(255,255,255,.15)', color: '#fff',
          display: 'grid', placeItems: 'center',
        }}
      >
        <Icon name="x" size={20} />
      </button>
      <img
        src={img.url}
        alt={img.alt || ''}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: 12,
          filter: 'grayscale(1)',
        }}
      />
    </div>
  );
}

export function openImage(url: string, alt?: string) {
  showViewer?.(url, alt);
}
