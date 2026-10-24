import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type CommonProps = {
  variant?: Variant;
  size?: 'sm' | 'md';
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type LinkProps = CommonProps & { href: string; onClick?: never; type?: never; disabled?: never };
type BtnProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export function Button(props: LinkProps | BtnProps) {
  const { variant = 'primary', size = 'md', block, className = '', children } = props;
  const classes = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', block ? 'btn-block' : '', className]
    .filter(Boolean).join(' ');

  if ('href' in props && props.href) {
    return <Link href={props.href} className={classes}>{children}</Link>;
  }
  const { variant: _v, size: _s, block: _b, className: _c, children: _ch, href: _h, ...rest } = props as BtnProps;
  return <button className={classes} {...rest}>{children}</button>;
}
