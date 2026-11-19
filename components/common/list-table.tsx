import { Link, useSearchParams } from 'react-router';
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { SortState } from '../shell/shell-context';
import { Icon } from '../ui/icon';
import { Select } from '../ui/select';
import { cx } from '@/lib/cx';
import s from './list-table.module.css';

// ---- List state in the URL ----

/** Query parameters the list state owns; the rest are filters. */
export const LIST_KEYS = ['scope', 'status', 'q', 'sort', 'page'];

export interface ListState {
  scope: string;
  status: string;
  q: string;
  sort: SortState;
  page: number;
}

/** "-updated" is newest first, "id" is ascending. */
const sortToParam = (s: SortState) => (s.d < 0 ? '-' : '') + s.k;
const sortFromParam = (v: string | null): SortState | null => (v ? { k: v.replace(/^-/, ''), d: v.startsWith('-') ? -1 : 1 } : null);

/**
 * Scope, status, search, sort and page of a list, kept in the URL
 * (?scope=mine&status=open&q=SyncThru&sort=-updated&page=2) so a filtered
 * list can be shared and comes back as it was after Back. Other parameters,
 * such as filters from Insights links, are left as they are. The URL is
 * updated with history.replaceState, so typing a search does not navigate.
 */
export function useListState(defaults: Omit<ListState, 'q' | 'page'>, onChange?: (s: ListState) => void) {
  const [sp] = useSearchParams();
  const [st, setSt] = useState<ListState>(() => ({
    scope: sp.get('scope') || defaults.scope,
    status: sp.get('status') || defaults.status,
    q: sp.get('q') || '',
    sort: sortFromParam(sp.get('sort')) || defaults.sort,
    page: Math.max(1, Math.floor(Number(sp.get('page'))) || 1)
  }));
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const put = (k: string, v: string, def: string) => (v && v !== def ? p.set(k, v) : p.delete(k));
    put('scope', st.scope, 'all');
    put('status', st.status, 'all');
    put('q', st.q.trim() ? st.q : '', '');
    put('sort', sortToParam(st.sort), '-updated');
    put('page', String(st.page), '1');
    const s = p.toString(), url = window.location.pathname + (s ? '?' + s : '');
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, '', url);
  }, [st]);
  const set = useCallback((patch: Partial<ListState>) => {
    setSt(s => {
      // Changing what is listed goes back to the first page.
      const next = { ...s, ...patch, ...(patch.page === undefined ? { page: 1 } : {}) };
      onChange?.(next);
      return next;
    });
  }, [onChange]);
  return [st, set] as const;
}

// ---- Table ----

export interface Col {
  key: string;
  label: string;
  /** Sort key, when the column sorts. */
  sort?: string;
  align?: 'end';
  /** A header for screen readers only, e.g. over a column of photos. */
  hidden?: boolean;
}

/**
 * A list with table semantics: a header row of column headers and one row per
 * item. In the card layout (narrow screens) the header is read by screen
 * readers only, and a sort menu replaces the clickable headers.
 */
export function ListTable({ label, cols, template, sort, onSort, cards, minWidth, lead, children }: {
  label: string;
  cols: Col[];
  template: string;
  sort: SortState;
  onSort: (s: SortState) => void;
  cards: boolean;
  minWidth: number;
  /** Header cell before the columns, e.g. a select-all checkbox. */
  lead?: ReactNode;
  children: ReactNode;
}) {
  const sortable = cols.filter(c => c.sort);
  const ariaSort = (c: Col) => (!c.sort ? undefined : sort.k === c.sort ? (sort.d > 0 ? 'ascending' : 'descending') : 'none');
  const click = (k: string) => onSort(sort.k === k ? { k, d: (-sort.d) as 1 | -1 } : { k, d: k === 'updated' ? -1 : 1 });
  return (
    <div className={s.table}>
      {cards ? (
        <div className={s.sortBar}>
          {lead}
          <span className={s.sortLabel}>Sort by</span>
          <div className={s.sortSelect}>
            <Select
              ariaLabel="Sort by"
              value={sortToParam(sort)}
              onValueChange={v => onSort(sortFromParam(v)!)}
              items={sortable.flatMap(c =>
                c.sort === 'updated'
                  ? [{ value: '-updated', label: 'Newest update', icon: 'arrow-down' }, { value: 'updated', label: 'Oldest update', icon: 'arrow-up' }]
                  : [{ value: c.sort!, label: c.label, icon: 'arrow-up' }, { value: '-' + c.sort, label: c.label + ', reversed', icon: 'arrow-down' }]
              )}
            />
          </div>
        </div>
      ) : null}
      <div className={cards ? undefined : s.scroller}>
        <div role="table" aria-label={label} style={cards ? undefined : { minWidth }}>
          <div role="rowgroup" className={cards ? 'visually-hidden' : undefined}>
            <div role="row" className={s.headRow} style={{ gridTemplateColumns: template }}>
              {lead !== undefined ? <div role="columnheader" className={s.headLead}>{cards ? 'Select' : lead}</div> : null}
              {cols.map(c => (
                <div key={c.key} role="columnheader" aria-sort={ariaSort(c)} className={cx(s.head, c.align === 'end' && s.headEnd)}>
                  {c.sort && !cards ? (
                    <button type="button" onClick={() => click(c.sort!)} className={s.sortButton}>
                      {c.label}
                      <Icon name={sort.k === c.sort ? (sort.d > 0 ? 'arrow-up' : 'arrow-down') : 'chevrons-up-down'} size={13} color={sort.k === c.sort ? 'var(--color-accent-text)' : 'oklch(0.75 0.01 290)'} />
                    </button>
                  ) : c.hidden ? (
                    <span className="visually-hidden">{c.label}</span>
                  ) : (
                    c.label
                  )}
                </div>
              ))}
            </div>
          </div>
          <div role="rowgroup" className={s.body}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A row that opens a page from anywhere on it; its RowLink is the real link. */
export function ListRow({ krow, template, areas, style, children }: { krow: number; template: string; areas?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      role="row"
      data-krow={krow}
      className={cx('clk row-link', s.row)}
      style={{ gridTemplateColumns: template, gridTemplateAreas: areas, ...style }}
    >
      {children}
    </div>
  );
}

export function Cell({ area, className, children }: { area?: string; className?: string; children?: ReactNode }) {
  return (
    <div role="cell" className={className} style={area ? { gridArea: area } : undefined}>
      {children}
    </div>
  );
}

/** The item's link, stretched over its whole row. Ctrl+click opens a new tab. */
export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link to={href} className={cx('row-stretch', s.rowLink)}>
      {children}
    </Link>
  );
}
