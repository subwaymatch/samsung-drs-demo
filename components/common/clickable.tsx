'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

/**
 * A row or chart mark that navigates on click and Enter. Used where an <a>
 * would wrap other links (avatars link to profiles).
 */
export function Clickable({ href, onOpen, children, className = '', style, title, krow, ariaLabel }: {
  href?: string;
  onOpen?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  krow?: number;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const go = () => {
    if (onOpen) onOpen();
    else if (href) router.push(href);
  };
  const enabled = !!(href || onOpen);
  return (
    <div
      role={enabled ? 'link' : undefined}
      tabIndex={enabled ? 0 : undefined}
      title={title}
      aria-label={ariaLabel}
      data-krow={krow}
      className={(enabled ? 'focus-ring cursor-pointer ' : '') + className}
      style={style}
      onClick={enabled ? go : undefined}
      onKeyDown={enabled ? (e: KeyboardEvent) => { if (e.key === 'Enter' && e.target === e.currentTarget) go(); } : undefined}
    >
      {children}
    </div>
  );
}

export const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
