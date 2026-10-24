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

const GLOBAL_KEY = 'strings.wp.global';
const CONV_PREFIX = 'strings.wp.conv.';

function read(key: string): Wallpaper | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const v = localStorage.getItem(key);
    if (!v) return null;
    return JSON.parse(v) as Wallpaper;
  } catch { return null; }
}

function write(key: string, w: Wallpaper) {
  try { localStorage.setItem(key, JSON.stringify(w)); } catch {}
}

export function getGlobalWallpaper(): Wallpaper {
  return read(GLOBAL_KEY) || { preset: 'none' };
}
export function setGlobalWallpaper(w: Wallpaper) {
  write(GLOBAL_KEY, w);
}

export function getWallpaper(convId: string): Wallpaper {
  return read(CONV_PREFIX + convId) || getGlobalWallpaper();
}
export function hasPerConvOverride(convId: string): boolean {
  return read(CONV_PREFIX + convId) !== null;
}
export function setWallpaper(convId: string, w: Wallpaper) {
  write(CONV_PREFIX + convId, w);
}
export function clearPerConvWallpaper(convId: string) {
  try { localStorage.removeItem(CONV_PREFIX + convId); } catch {}
}

export function wallpaperStyle(w: Wallpaper): CSSProperties | undefined {
  if (!w || w.preset === 'none') return undefined;
  if (w.preset === 'custom' && w.url) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), url(${w.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: PRESETS[w.preset] };
}
