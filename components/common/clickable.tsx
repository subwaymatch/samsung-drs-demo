'use client';

import Link from 'next/link';
import { useId, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

/**
 * A row, card or chart mark that opens a page. With an href it holds a real
 * link stretched over the whole element, so Ctrl+click, middle-click and link
 * previews work, while links and controls inside it (avatars, checkboxes) sit
 * above the stretched link and keep working. The link is named by the element's
 * text unless ariaLabel is given. tip shows a tooltip on hover and focus.
 * Without an href, onOpen makes it a button.
 */
export function Clickable({ href, onOpen, children, className = '', style, title, krow, ariaLabel, tip, tipAlign }: {
  href?: string;
  onOpen?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
  krow?: number;
  ariaLabel?: string;
  tip?: string;
  tipAlign?: 'start' | 'end';
}) {
  const id = useId();
  const tipProps = tip ? { 'data-tip': tip, 'data-tip-align': tipAlign } : {};
  if (href) {
    const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);
    return (
      <div id={id} data-krow={krow} className={'clk ' + (positioned ? '' : 'relative ') + className} style={style} {...tipProps}>
        <Link
          href={href}
          prefetch={false}
          className="clk-link focus-ring"
          title={title}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : id}
          onClick={onOpen ? e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) onOpen(); } : undefined}
        />
        {children}
      </div>
    );
  }
  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      title={title}
      aria-label={ariaLabel}
      data-krow={krow}
      className={(onOpen ? 'focus-ring cursor-pointer ' : '') + className}
      style={style}
      onClick={onOpen}
      onKeyDown={onOpen ? (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen(); } } : undefined}
      {...tipProps}
    >
      {children}
    </div>
  );
}

export const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

const KEY_BG = 'oklch(0.965 0.024 293)';
/**
 * The row the keyboard cursor (J/K) is on: a tinted pill that reaches 12px past
 * the row on both sides, so nothing is drawn over the row's first column. Lists
 * inside a scroll container need 12px of horizontal padding to show it.
 */
export const KEY_ROW: CSSProperties = {
  background: KEY_BG,
  borderRadius: 10,
  borderBottomColor: 'transparent',
  boxShadow: `-12px 0 0 ${KEY_BG}, 12px 0 0 ${KEY_BG}`
};
