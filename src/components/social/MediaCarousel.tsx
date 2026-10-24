'use client';
import { openImage } from '@/components/ui/ImageViewer';
import { Icon } from '@/components/ui/Icon';

export function MediaCarousel({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null;
  const list = urls.slice(0, 4);
  
  return (
    <div style={{ position: 'relative', marginTop: 8, borderRadius: 20, overflow: 'hidden' }}>
      {list.length === 1 ? (
        <img src={list[0]} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: list.length === 2 ? '1fr 1fr' : '1fr 1fr', gap: 2 }}>
          {list.map((u, i) => (
            <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
              <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
      
      {/* Action buttons overlay */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
        <a href={list[0]} download target="_blank" rel="noopener noreferrer" className="ib" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', width: 32, height: 32 }} aria-label="Download">
          <Icon name="dl" size={16} />
        </a>
        <button onClick={() => openImage(list[0])} className="ib" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', width: 32, height: 32 }} aria-label="Expand">
          <Icon name="img" size={16} />
        </button>
      </div>
    </div>
  );
}
