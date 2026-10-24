import type { ReactNode } from 'react';
import { Icon, IconName } from './Icon';

export function EmptyState({
  icon, title, action, children,
}: { icon: IconName; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={32} /></div>
      <span className="empty-title">{title}</span>
      {children ? <p style={{ margin: '6px 0 0', fontSize: '.92em' }}>{children}</p> : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
