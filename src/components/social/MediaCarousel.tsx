'use client';
import { useState } from 'react';
import { openImage } from '@/components/ui/ImageViewer';
import { Icon } from '@/components/ui/Icon';

export function MediaCarousel({ urls }: { urls: string[] }) {
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  if (!urls || urls.length === 0) return null;
  const list = urls.slice(0, 4);
  
  return (
    <div style={{ position: 'relative', marginTop: 8, borderRadius: 20, overflow: 'hidden' }}>
      {list.length === 1 ? (
        failed[0] ? (
           <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-3)', color: 'var(--tx-2)' }}>
              <Icon name="img" size={32} />
              <p style={{ margin: '8px 0 0', fontSize: '.9em' }}>Image unavailable</p>
           </div>
        ) : (
          <img 
            src={list[0]} 
            alt="" 
            onError={() => setFailed(prev => ({ ...prev, 0: true }))}
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} 
          />
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: list.length === 2 ? '1fr 1fr' : '1fr 1fr', gap: 2 }}>
          {list.map((u, i) => (
            <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', background: 'var(--bg-3)' }}>
              {failed[i] ? (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--tx-2)' }}>
                  <Icon name="img" size={24} />
                </div>
              ) : (
                <img 
                  src={u} 
                  alt="" 
                  onError={() => setFailed(prev => ({ ...prev, [i]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      {!failed[0] && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          <a href={list[0]} download target="_blank" rel="noopener noreferrer" className="ib" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', width: 32, height: 32 }} aria-label="Download">
            <Icon name="dl" size={16} />
          </a>
          <button onClick={() => openImage(list[0])} className="ib" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', width: 32, height: 32 }} aria-label="Expand">
            <Icon name="img" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
