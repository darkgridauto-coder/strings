'use client';
import { openImage } from './ImageViewer';

export function Avatar({
  name, src, size = 'md', clickable = true,
}: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg'; clickable?: boolean }) {
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const cls = ['avatar', size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : ''].filter(Boolean).join(' ');

  function onClick(e: React.MouseEvent) {
    if (!src) return;
    e.preventDefault();
    e.stopPropagation();
    openImage(src, name);
  }

  if (src && clickable) {
    return (
      <span className={cls} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter') openImage(src!, name); }} aria-label={`View ${name}'s photo`}>
        <img src={src} alt={name} />
      </span>
    );
  }
  return (
    <span className={cls}>
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  );
}
