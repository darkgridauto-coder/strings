import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, IconName } from './Icon';

type Props = {
  icon?: IconName;
  title: string;
  sub?: string;
  trail?: ReactNode;
  href?: string;
  onClick?: () => void;
  showChevron?: boolean;
};

export function Row({ icon, title, sub, trail, href, onClick, showChevron }: Props) {
  const content = (
    <>
      {icon ? <Icon name={icon} /> : null}
      <div className="row-body">
        <span className="row-title">{title}</span>
        {sub ? <span className="row-sub">{sub}</span> : null}
      </div>
      <div className="row-trail">
        {trail}
        {showChevron || (href && !trail) ? <Icon name="chevron" size={16} /> : null}
      </div>
    </>
  );

  if (href) {
    return <Link href={href} className="row">{content}</Link>;
  }
  if (onClick) {
    return (
      <div className="row" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()} style={{ width: '100%', textAlign: 'left' }}>
        {content}
      </div>
    );
  }
  return <div className="row" style={{ cursor: 'default' }}>{content}</div>;
}
