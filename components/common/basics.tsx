'use client';

import NextLink from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { smallPhoto } from '@/lib/people';
import type { Thumb as ThumbT } from '@/lib/products';

export function PageHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {sub ? <p className="leading-[1.7] text-muted">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ title, sub, right, small }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; small?: boolean }) {
  const head = (
    <div className="flex min-w-0 flex-col gap-1">
      {small ? <h3 className="text-sm font-semibold text-muted">{title}</h3> : <h2 className="text-base font-[650]">{title}</h2>}
      {sub ? <span className="text-sm leading-normal text-pretty text-muted">{sub}</span> : null}
    </div>
  );
  if (!right) return head;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-[1_1_320px]">{head}</div>
      {right}
    </div>
  );
}

/** A top-ruled section, used throughout the dashboards and detail pages. */
export function Section({ title, sub, right, children, className = '', gap = 'gap-5', pt = 'pt-7' }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; gap?: string; pt?: string }) {
  return (
    <section className={`flex flex-col border-t border-line ${pt} ${gap} ${className}`}>
      {title ? <SectionTitle title={title} sub={sub} right={right} /> : null}
      {children}
    </section>
  );
}

/** Small tinted card for "nothing here yet" states inside a section. */
export function Note({ icon, title, text, className = '' }: { icon: string; title: string; text?: ReactNode; className?: string }) {
  return (
    <div className={'flex items-center gap-4 rounded-md bg-accent-wash px-5 py-[18px] ' + className}>
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-soft">
        <Icon name={icon} size={20} color="oklch(0.5 0.17 293)" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        {text ? <span className="text-sm leading-normal text-pretty text-muted">{text}</span> : null}
      </div>
    </div>
  );
}

/** Large centered empty state for lists. */
export function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3.5 px-4 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Icon name={icon} size={26} color="oklch(0.5 0.17 293)" />
      </span>
      <div className="flex max-w-[420px] flex-col gap-1">
        <span className="text-base font-[650]">{title}</span>
        <span className="text-sm leading-normal text-pretty text-muted">{text}</span>
      </div>
    </div>
  );
}

export function StatusLabel({ l, fg, icon, size = 16, weight = 550, className = '' }: { l: string; fg: string; icon: string; size?: number; weight?: number; className?: string }) {
  return (
    <span className={'flex items-center gap-2 whitespace-nowrap ' + className} style={{ color: fg, fontWeight: weight }}>
      <Icon name={icon} size={size} color={fg} />
      {l}
    </span>
  );
}

/** Product photo placeholder. */
export function Thumb({ th, w = 56, h = 42, iconSize = 20, label }: { th: ThumbT; w?: number; h?: number; iconSize?: number; label?: boolean }) {
  return (
    <div title={th.hint} className={'grid flex-none place-items-center overflow-hidden rounded ' + (th.photo ? '' : 'bg-[oklch(0.975_0.01_293)]')} style={{ width: w, height: h }}>
      {th.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={th.photo} alt="" loading="lazy" decoding="async" className="block h-full w-full object-contain p-[6%]" />
      ) : label ? (
        <div className="flex flex-col items-center gap-2 text-[oklch(0.62_0.06_293)]">
          <Icon name="printer" size={iconSize} color="oklch(0.68 0.07 293)" />
          <span className="text-sm">Product image</span>
        </div>
      ) : (
        <Icon name="printer" size={iconSize} color="oklch(0.68 0.07 293)" />
      )}
    </div>
  );
}

/** A person's portrait, or a placeholder while they have none. */
export function PhotoPlaceholder({ w, h, iconSize = 24, title, src }: { w: number; h: number; iconSize?: number; title?: string; src?: string }) {
  return (
    <div title={title} className={'grid flex-none place-items-center overflow-hidden rounded ' + (src ? '' : 'bg-[oklch(0.965_0.015_293)]')} style={{ width: w, height: h }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={w <= 96 ? smallPhoto(src) : src} alt="" loading="lazy" decoding="async" className="block h-full w-full object-cover object-top" />
      ) : (
        <Icon name="user" size={iconSize} color="oklch(0.68 0.07 293)" />
      )}
    </div>
  );
}

export interface Pager {
  p: number;
  pages: number;
  show: boolean;
  rangeText: string;
}
export function pagerOf(total: number, page: number, size: number): Pager {
  const pages = Math.max(1, Math.ceil(total / size)), p = Math.min(Math.max(1, page), pages);
  return { p, pages, show: pages > 1, rangeText: total ? `${(p - 1) * size + 1}-${Math.min(total, p * size)} of ${total}` : '' };
}
export function Pagination({ pg, onPage }: { pg: Pager; onPage: (p: number) => void }) {
  if (!pg.show) return null;
  const { p, pages } = pg;
  const keep = new Set([1, pages, p - 1, p, p + 1]);
  if (p <= 4) [2, 3, 4, 5].forEach(i => keep.add(i));
  if (p >= pages - 3) [pages - 4, pages - 3, pages - 2, pages - 1].forEach(i => keep.add(i));
  const nums = pages <= 7 ? Array.from({ length: pages }, (_, i) => i + 1) : [...keep].filter(i => i >= 1 && i <= pages).sort((a, b) => a - b);
  const list: (number | '...')[] = [];
  nums.forEach((i, k) => {
    if (k && i - nums[k - 1] > 1) list.push('...');
    list.push(i);
  });
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <span className="text-muted tabular-nums">{pg.rangeText}</span>
      <nav className="flex flex-wrap items-center gap-1" aria-label="Pages">
        <Button variant="ghost" size="sm" icon="chevron-left" title="Previous page" onClick={() => onPage(Math.max(1, p - 1))} disabled={p <= 1}><span className="max-[560px]:hidden">Previous</span></Button>
        {list.map((x, i) =>
          x === '...' ? (
            <Button key={'e' + i} variant="page" size="sm" disabled>...</Button>
          ) : (
            <Button key={x} variant={x === p ? 'pageActive' : 'page'} size="sm" onClick={() => onPage(x)}>{String(x)}</Button>
          )
        )}
        <Button variant="ghost" size="sm" iconRight="chevron-right" title="Next page" onClick={() => onPage(Math.min(pages, p + 1))} disabled={p >= pages}><span className="max-[560px]:hidden">Next</span></Button>
      </nav>
    </div>
  );
}

export interface Scope {
  k: string;
  label: string;
  icon: string;
  count: number;
}
/** Underlined tabs with counts, used for list scopes. */
export function ScopeTabs({ scopes, value, onChange }: { scopes: Scope[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-7 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none] max-sm:pr-6 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)]" role="tablist">
      {scopes.map(t => {
        const on = t.k === value;
        return (
          <button
            key={t.k}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.k)}
            className="-mb-px flex h-11 cursor-pointer items-center gap-2 border-0 border-b-2 border-solid bg-transparent p-0 text-sm whitespace-nowrap hover:text-ink-2"
            style={{ borderBottomColor: on ? 'var(--color-accent)' : 'transparent', color: on ? 'var(--color-accent-ink)' : 'oklch(0.42 0.02 290)', fontWeight: on ? 650 : 550 }}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] text-xs leading-none font-semibold tabular-nums"
              style={{ padding: on ? '0 7px' : '0 2px', background: on ? 'var(--color-accent-soft)' : 'transparent', color: on ? 'var(--color-accent-ink)' : 'var(--color-muted)' }}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Chips showing filters that came in from an Insights link. */
export function QuickFilters({ chips, clearHref, source = 'Filtered from Insights' }: { chips: string[]; clearHref: string; source?: string }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-l-[3px] border-accent-bar py-1.5 pl-4">
      <span className="font-semibold text-accent-ink">{source}</span>
      {chips.map(c => (
        <span key={c} className="inline-flex h-7 items-center rounded border border-[oklch(0.88_0.04_293)] px-2.5 whitespace-nowrap text-[oklch(0.3_0.04_293)]">{c}</span>
      ))}
      <NextLink href={clearHref} className="bui-btn bui-ghost bui-sm">
        <Icon name="filter-x" size={14} />
        Clear filters
      </NextLink>
    </div>
  );
}

export function Loading() {
  return (
    <div className="mx-auto flex max-w-[1200px] animate-pulse flex-col gap-6 motion-reduce:animate-none" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-48 rounded bg-[oklch(0.96_0.01_290)]" />
      <div className="h-4 w-96 max-w-full rounded bg-[oklch(0.97_0.008_290)]" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-10 rounded bg-[oklch(0.975_0.006_290)]" />
        ))}
      </div>
    </div>
  );
}

export const Mono = ({ children, className = '' }: { children: ReactNode; className?: string }) => <span className={'font-mono text-sm ' + className}>{children}</span>;
