'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import NextLink from 'next/link';
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { Icon } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger' | 'dangerSolid' | 'subOn' | 'nav' | 'navActive' | 'page' | 'pageActive';

interface Common {
  variant?: ButtonVariant;
  size?: 'sm';
  icon?: string;
  iconRight?: string;
  iconOnly?: boolean;
  title?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const cls = (variant: ButtonVariant, size?: 'sm', iconOnly?: boolean, extra?: string) =>
  ['bui-btn', 'bui-' + variant, size === 'sm' ? 'bui-sm' : '', iconOnly ? 'bui-icon-only' : '', extra || ''].filter(Boolean).join(' ');

export function Button({ variant = 'secondary', size, icon, iconRight, iconOnly, title, children, className, style, onClick, disabled, type = 'button' }: Common & {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const is = size === 'sm' ? 14 : 16;
  return (
    <BaseButton type={type} className={cls(variant, size, iconOnly, className)} style={style} onClick={onClick} disabled={disabled} title={title} aria-label={iconOnly ? title : undefined}>
      {icon ? <Icon name={icon} size={is} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={is} /> : null}
    </BaseButton>
  );
}

/** A link styled as a button, using client-side navigation. */
export function LinkButton({ href, variant = 'secondary', size, icon, iconRight, iconOnly, title, children, className, style }: Common & { href: string }) {
  const is = size === 'sm' ? 14 : 16;
  return (
    <NextLink href={href} className={cls(variant, size, iconOnly, className)} style={style} title={title} aria-label={iconOnly ? title : undefined}>
      {icon ? <Icon name={icon} size={is} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={is} /> : null}
    </NextLink>
  );
}
