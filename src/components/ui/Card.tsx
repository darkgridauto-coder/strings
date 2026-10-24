import type { ReactNode, CSSProperties } from 'react';

export function Card({
  children, className = '', style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}
