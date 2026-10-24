import type { CSSProperties } from 'react';

export type WallpaperPreset = 'none' | 'paper' | 'dots' | 'gradient' | 'dark' | 'custom';

const PRESETS: Record<WallpaperPreset, string> = {
  none: '',
  paper: 'repeating-linear-gradient(45deg, var(--b2) 0 10px, var(--bg) 10px 20px)',
  dots: 'radial-gradient(var(--b3) 1px, transparent 1px) 0 0 / 20px 20px',
  gradient: 'linear-gradient(135deg, #f5f5f5 0%, #e7e7e7 100%)',
  dark: 'linear-gradient(180deg, #1a1a1a 0%, #050505 100%)',
  custom: '',
};

export type Wallpaper = { preset: WallpaperPreset; url?: string };

export function getWallpaper(convId: string): Wallpaper {
  if (typeof localStorage === 'undefined') return { preset: 'none' };
  try {
    const v = localStorage.getItem('strings.wp.' + convId);
    if (!v) return { preset: 'none' };
    return JSON.parse(v) as Wallpaper;
  } catch { return { preset: 'none' }; }
}

export function setWallpaper(convId: string, value: Wallpaper) {
  try { localStorage.setItem('strings.wp.' + convId, JSON.stringify(value)); } catch {}
}

export function wallpaperStyle(w: Wallpaper): CSSProperties | undefined {
  if (w.preset === 'none') return undefined;
  if (w.preset === 'custom' && w.url) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), url(${w.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: PRESETS[w.preset] };
}
