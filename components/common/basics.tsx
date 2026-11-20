import { Link } from 'react-router';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { smallPhoto } from '@/lib/people';
import type { Thumb as ThumbT } from '@/lib/products';
import { cx } from '@/lib/cx';
import { ILLUSTRATION, illustrationSrc } from '@/lib/illustrations';
import s from './basics.module.css';

/** The page's title in Title Case, with its actions (a button, filters, a status line) on the right. */
export function PageHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <header className={s.pageHeader}>
      <h1 className={s.pageTitle}>{title}</h1>
      {action}
    </header>
  );
}

export function SectionTitle({ title, sub, right, small }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; small?: boolean }) {
  const head = (
    <div className={s.titleBlock}>
      {small ? <h3 className={s.titleSmall}>{title}</h3> : <h2 className={s.title}>{title}</h2>}
      {sub ? <span className={s.sub}>{sub}</span> : null}
    </div>
  );
  if (!right) return head;
  return (
    <div className={s.titleRow}>
      <div className={s.titleMain}>{head}</div>
      {right}
    </div>
  );
}

/** A titled section. Sections are set apart by the space around them, not by rules. gap is the space between its children in px (default 20). */
export function Section({ title, sub, right, children, className, gap }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; gap?: number }) {
  return (
    <section className={cx(s.section, className)} style={gap === undefined ? undefined : { gap }}>
      {title ? <SectionTitle title={title} sub={sub} right={right} /> : null}
      {children}
    </section>
  );
}

/** Small tinted card for "nothing here yet" states inside a section. */
export function Note({ icon, title, text, className }: { icon: string; title: string; text?: ReactNode; className?: string }) {
  return (
    <div className={cx(s.note, className)}>
      <span className={s.noteIcon}>
        <Icon name={icon} size={20} color="oklch(0.5 0.17 293)" />
      </span>
      <div className={s.noteText}>
        <span className={s.noteTitle}>{title}</span>
        {text ? <span className={s.sub}>{text}</span> : null}
      </div>
    </div>
  );
}

/** Large centered empty state for lists. */
/**
 * One of the isometric illustrations (lib/illustrations.ts), `height` px tall. Decorative: the text next to it
 * says what it means, so it has no alt text. Its width comes from the file's proportions, so nothing shifts as it loads.
 */
export function Illustration({ name, height, className }: { name: string; height: number; className?: string }) {
  const it = ILLUSTRATION[name];
  if (!it) return null;
  return <img src={illustrationSrc(name)} alt="" width={Math.round((it.width / it.height) * height)} height={height} className={cx(s.illustration, className)} />;
}

/** Large centered empty state for lists, led by an illustration. */
export function EmptyState({ art, title, text }: { art: string; title: string; text: string }) {
  return (
    <div className={s.empty}>
      <Illustration name={art} height={136} />
      <div className={s.emptyText}>
        <span className={s.emptyTitle}>{title}</span>
        <span className={s.sub}>{text}</span>
      </div>
    </div>
  );
}

export function StatusLabel({ l, fg, icon, size = 16, weight = 550 }: { l: string; fg: string; icon: string; size?: number; weight?: number }) {
  return (
    <span className={s.status} style={{ color: fg, fontWeight: weight }}>
      <Icon name={icon} size={size} color={fg} />
      {l}
    </span>
  );
}

/** Product photo placeholder. */
export function Thumb({ th, w = 56, h = 42, iconSize = 20, label }: { th: ThumbT; w?: number; h?: number; iconSize?: number; label?: boolean }) {
  return (
    <div title={th.hint} className={cx(s.thumb, !th.photo && s.thumbEmpty)} style={{ width: w, height: h }}>
      {th.photo ? (
        <img src={th.photo} alt="" loading="lazy" decoding="async" className={s.thumbImg} />
      ) : label ? (
        <div className={s.thumbLabel}>
          <Icon name="printer" size={iconSize} color="oklch(0.68 0.07 293)" />
          <span className={s.thumbLabelText}>Product image</span>
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
    <div title={title} className={cx(s.thumb, !src && s.photoEmpty)} style={{ width: w, height: h }}>
      {src ? (
        <img src={w <= 96 ? smallPhoto(src) : src} alt="" loading="lazy" decoding="async" className={s.photoImg} />
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
    <div className={s.pager}>
      <span className={s.pagerRange}>{pg.rangeText}</span>
      <nav className={s.pagerNav} aria-label="Pages">
        <Button variant="ghost" size="sm" icon="chevron-left" title="Previous page" onClick={() => onPage(Math.max(1, p - 1))} disabled={p <= 1}><span className={s.pagerWord}>Previous</span></Button>
        {list.map((x, i) =>
          x === '...' ? (
            <Button key={'e' + i} variant="page" size="sm" disabled>...</Button>
          ) : (
            <Button key={x} variant={x === p ? 'pageActive' : 'page'} size="sm" onClick={() => onPage(x)}>{String(x)}</Button>
          )
        )}
        <Button variant="ghost" size="sm" iconRight="chevron-right" title="Next page" onClick={() => onPage(Math.min(pages, p + 1))} disabled={p >= pages}><span className={s.pagerWord}>Next</span></Button>
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
    <div className={s.scopes} role="tablist">
      {scopes.map(t => {
        const on = t.k === value;
        return (
          <button
            key={t.k}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.k)}
            className={s.scope}
            style={{ borderBottomColor: on ? 'var(--color-accent)' : 'transparent', color: on ? 'var(--color-accent-ink)' : 'oklch(0.42 0.02 290)', fontWeight: on ? 650 : 550 }}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
            <span
              className={s.scopeCount}
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
    <div className={s.quick}>
      <span className={s.quickSource}>{source}</span>
      {chips.map(c => (
        <span key={c} className={s.quickChip}>{c}</span>
      ))}
      <Link to={clearHref} className="bui-btn bui-ghost bui-sm">
        <Icon name="filter-x" size={14} />
        Clear filters
      </Link>
    </div>
  );
}

export function Loading() {
  return (
    <div className={s.loading} aria-busy="true" aria-label="Loading">
      <div className={s.loadingTitle} />
      <div className={s.loadingSub} />
      <div className={s.loadingRows}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={s.loadingRow} />
        ))}
      </div>
    </div>
  );
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cx(s.mono, className)}>{children}</span>;
