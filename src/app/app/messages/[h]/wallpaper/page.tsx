'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getWallpaper, setWallpaper, WallpaperPreset } from '@/lib/chatWallpaper';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

export default function WallpaperPage({ params }: { params: { h: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [preset, setPreset] = useState<WallpaperPreset>('none');

  useEffect(() => {
    const w = getWallpaper(params.h);
    setPreset(w.preset);
  }, [params.h]);

  const presets: [WallpaperPreset, string][] = [
    ['none', 'None'],
    ['paper', 'Paper'],
    ['dots', 'Dots'],
    ['gradient', 'Gradient'],
    ['dark', 'Dark'],
  ];

  function save(p: WallpaperPreset) {
    setWallpaper(params.h, { preset: p });
    setPreset(p);
    showToast('Wallpaper updated');
    setTimeout(() => router.back(), 400);
  }

  return (
    <div className="page" style={{ padding: '16px' }}>
      <Link href={`/app/messages/${params.h}/settings`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <Icon name="back" size={16} /> Back
      </Link>
      <h2 style={{ fontSize: '1.5em', margin: '4px 0 8px' }}>Chat wallpaper</h2>
      <p className="muted" style={{ marginBottom: 16 }}>Choose a background for this conversation. Stored on this device only.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {presets.map(([k, label]) => (
          <button key={k} onClick={() => save(k)} style={{
            padding: 20, borderRadius: 16,
            border: preset === k ? '2px solid var(--tx)' : '1px solid var(--ln)',
            background: k === 'none' ? 'var(--bg)' :
              k === 'paper' ? 'repeating-linear-gradient(45deg, var(--b2) 0 10px, var(--bg) 10px 20px)' :
              k === 'dots' ? 'radial-gradient(var(--b3) 1px, transparent 1px) 0 0 / 20px 20px' :
              k === 'gradient' ? 'linear-gradient(135deg, #f5f5f5, #e7e7e7)' : '#0a0a0a',
            color: k === 'dark' ? '#fff' : 'var(--tx)',
            minHeight: 100, fontWeight: 600, fontSize: '.95em',
          }}>
            {label}
            {preset === k && <div style={{ marginTop: 6 }}><Icon name="check" size={16} /></div>}
          </button>
        ))}
      </div>
    </div>
  );
}
