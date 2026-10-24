'use client';
import { useState } from 'react';
import { openImage } from './ImageViewer';

export function Avatar({
  name, src, size = 'md', clickable = true,
}: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg'; clickable?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const cls = ['avatar', size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : ''].filter(Boolean).join(' ');

  function onClick(e: React.MouseEvent) {
    if (!src || failed) return;
    e.preventDefault();
    e.stopPropagation();
    openImage(src, name);
  }

  const showImg = src && !failed;

  if (showImg && clickable) {
    return (
      <span className={cls} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') openImage(src!, name); }} aria-label={`View ${name}'s photo`}>
        <img src={src} alt={name} onError={() => setFailed(true)} />
      </span>
    );
  }
  return (
    <span className={cls}>
      {showImg ? <img src={src} alt={name} onError={() => setFailed(true)} /> : initials}
    </span>
  );
}
