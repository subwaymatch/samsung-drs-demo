'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, type ReactNode } from 'react';
import { DEC, PS, RST, RST_KEYS, TYPE_ICON, UM } from '@/lib/constants';
import { fDate } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av } from '@/lib/people';
import { rModelId, thumbOf } from '@/lib/products';
import { firstDec, lastAt } from '@/lib/records';
import { useApp } from '@/lib/store';
import type { Option, Review } from '@/lib/types';
import { EmptyState, Loading, PageHeader, Pagination, pagerOf, QuickFilters, ScopeTabs, StatusLabel, Thumb } from '../common/basics';
import { KEY_ROW } from '../common/clickable';
import { Cell, type Col, ListRow, type ListState, ListTable, LIST_KEYS, RowLink, useListState } from '../common/list-table';
import { useKeyRows, useShell } from '../shell/shell-context';
import { LinkButton } from '../ui/button';
import { Input } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Select } from '../ui/select';
import { rangeChip } from './defects-list';
import { langOf } from '@/lib/text';


export function ReviewsList() {
  const app = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const { ui, setUi, kIdx, setKIdx, contentW } = useShell();
  const [ls, setLs] = useListState(
    { scope: ui.rScope, status: ui.rStatus, sort: ui.rSort },
    useCallback((s: ListState) => setUi({ rScope: s.scope, rStatus: s.status, rSort: s.sort }), [setUi])
  );
  const qf = useMemo(() => Object.fromEntries([...sp.entries()].filter(([k]) => !LIST_KEYS.includes(k))), [sp]);
  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';

  const view = useMemo(() => {
    if (!data || !prefs) return null;
    const rq = qf;
    const rqF = (r: Review) => {
      if (rq.type && r.type !== rq.type) return false;
      if (rq.reviewer && !r.reviewers.some(v => v.u === rq.reviewer)) return false;
      if (rq.outcome === 'withdrawn') {
        if (r.status !== 'withdrawn') return false;
      } else if (rq.outcome) {
        const f = firstDec(r);
        if (!f || f.dec !== rq.outcome || r.status === 'withdrawn') return false;
      }
      if (rq.from && r.submitted < rq.from) return false;
      if (rq.to && r.submitted >= rq.to) return false;
      return true;
    };
    const chips = [
      rq.type, rq.reviewer && UM[rq.reviewer] && 'Reviewer: ' + UM[rq.reviewer].name,
      rq.outcome && DEC[rq.outcome] && (rq.outcome === 'withdrawn' ? 'Outcome: ' : 'First decision: ') + DEC[rq.outcome],
      (rq.from || rq.to) && rangeChip('Submitted', rq.from, rq.to)
    ].filter((x): x is string => !!x);
    const Rq = data.reviews.filter(rqF);
    const scopeF: Record<string, (r: Review) => boolean> = {
      all: () => true, mine: r => r.author === meId, reviewing: r => r.reviewers.some(v => v.u === meId), subscribed: r => isSubscribed(prefs.subs, r, meId)
    };
    const scope = scopeF[ls.scope] ? ls.scope : 'all';
    const inScope = Rq.filter(scopeF[scope]);
    const ql = ls.q.trim().toLowerCase();
    const get: Record<string, (r: Review) => string | number> = {
      id: r => r.id, title: r => r.title.toLowerCase(), type: r => r.type, author: r => UM[r.author].en, status: r => RST_KEYS.indexOf(r.status), updated: r => lastAt(r)
    };
    const st = get[ls.sort.k] ? ls.sort : { k: 'updated', d: -1 };
    const all = inScope
      .filter(r => ls.status === 'all' || r.status === ls.status)
      .filter(r => !ql || (r.id + ' ' + r.title + ' ' + r.branch).toLowerCase().includes(ql))
      .map(r => ({ r, k: get[st.k](r) }))
      .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0) * st.d)
      .map(x => x.r);
    return {
      chips, all, scope,
      scopes: [['all', 'All', 'layers'], ['mine', 'My requests', 'git-pull-request'], ['reviewing', 'Assigned to me', 'user-check'], ['subscribed', 'Subscribed', 'bell']].map(([k, label, icon]) => ({ k, label, icon, count: Rq.filter(scopeF[k]).length })),
      statuses: [{ value: 'all', label: 'All statuses', icon: 'layers', count: inScope.length }, ...RST_KEYS.map(k => ({ value: k, label: RST[k].l, icon: RST[k].icon, color: RST[k].fg, count: inScope.filter(r => r.status === k).length }))] as Option[]
    };
  }, [data, prefs, qf, ls, meId]);

  const pg = pagerOf(view ? view.all.length : 0, ls.page, PS);
  const rows = view ? view.all.slice((pg.p - 1) * PS, pg.p * PS) : [];
  useKeyRows(rows.map(r => ({ open: () => router.push('/reviews/' + r.id) })));
  if (!view || !data) return <Loading />;

  const cards = contentW > 0 && contentW < 640, compact = contentW > 0 && contentW < 1100;
  const template = cards ? 'minmax(0,1fr) auto' : compact ? '76px minmax(0,1fr) 150px 190px' : '56px 76px minmax(0,1fr) 140px 150px 150px 190px 72px';
  const areas = cards ? '"id st" "title title" "au upd"' : undefined;
  const cols: Col[] = [
    ...(compact ? [] : [{ key: 'thumb', label: 'Model photo', hidden: true }]),
    { key: 'id', label: 'ID', sort: 'id' }, { key: 'title', label: 'Change', sort: 'title' },
    ...(compact ? [] : [{ key: 'type', label: 'Type', sort: 'type' }]),
    { key: 'author', label: 'Author', sort: 'author' },
    ...(compact ? [] : [{ key: 'rv', label: 'Reviewers' }]),
    { key: 'status', label: 'Status', sort: 'status' },
    ...(compact && !cards ? [] : [{ key: 'updated', label: 'Updated', sort: 'updated', align: 'end' as const }])
  ];
  // Cards show the same cells in a different order on screen.
  const order = cards ? ['id', 'title', 'author', 'status', 'updated'] : cols.map(c => c.key);
  const go = (patch: Partial<ListState>) => { setLs(patch); setKIdx(-1); };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <PageHeader title="Code reviews" sub="Every code change is reviewed by the code review team before it is submitted" action={<LinkButton href="/reviews/new" variant="primary" icon="git-pull-request">Request review</LinkButton>} />
      <ScopeTabs scopes={view.scopes} value={view.scope} onChange={k => go({ scope: k })} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted">Status</span>
        <div className="w-[260px] max-w-full max-sm:flex-1">
          <Select ariaLabel="Status" items={view.statuses} value={ls.status} onValueChange={v => go({ status: v })} />
        </div>
        <div className="w-full sm:ml-auto sm:w-[260px]">
          <Input id="listsearch" icon="search" ariaLabel="Search code reviews" value={ls.q} onChange={v => setLs({ q: v })} placeholder="Search ID, title, branch" />
        </div>
      </div>
      <QuickFilters chips={view.chips} clearHref="/reviews" />
      <ListTable label="Code reviews" cols={cols} template={template} sort={ls.sort} onSort={s => go({ sort: s })} cards={cards} minWidth={compact ? 680 : 1116}>
        {rows.map((r, i) => {
          const n = r.reviewers.length, ap = r.reviewers.filter(v => v.dec === 'approved').length, author = av(r.author);
          const cell: Record<string, ReactNode> = {
            thumb: <Cell key="thumb"><Thumb th={thumbOf(rModelId(r, data.defects))} /></Cell>,
            id: <Cell key="id" area={cards ? 'id' : undefined}><RowLink href={'/reviews/' + r.id}>{r.id}</RowLink></Cell>,
            title: (
              <Cell key="title" area={cards ? 'title' : undefined} className="flex min-w-0 flex-col gap-1">
                <span lang={langOf(r.title)} className={cards ? 'line-clamp-2 font-[550]' : 'bui-trunc font-[550]'}>{r.title}</span>
                <span className="bui-trunc font-mono text-sm text-muted">{'//depot/printing/' + r.branch}</span>
              </Cell>
            ),
            type: <Cell key="type" className="flex items-center gap-2 whitespace-nowrap"><Icon name={TYPE_ICON[r.type]} color="var(--color-muted)" size={16} />{r.type}</Cell>,
            author: <Cell key="author" area={cards ? 'au' : undefined} className="flex min-w-0 items-center gap-2.5"><Person person={author} size={26} /><span className="bui-trunc">{author.name}</span></Cell>,
            rv: (
              <Cell key="rv" className="flex min-w-0 items-center gap-2.5">
                {n ? (
                  <>
                    <span className="flex flex-none gap-1">{r.reviewers.slice(0, 3).map(v => <Person key={v.u} person={av(v.u)} size={26} />)}</span>
                    <span className="bui-trunc">{n === 1 ? UM[r.reviewers[0].u].name : `${ap}/${n} approved`}</span>
                  </>
                ) : (
                  <span className="text-faint">Not assigned</span>
                )}
              </Cell>
            ),
            status: <Cell key="status" area={cards ? 'st' : undefined}><StatusLabel {...RST[r.status]} /></Cell>,
            updated: <Cell key="updated" area={cards ? 'upd' : undefined} className="text-right text-sm text-muted tabular-nums">{cards ? 'Updated ' : ''}{fDate(lastAt(r))}</Cell>
          };
          return (
            <ListRow key={r.id} krow={i} template={template} areas={areas} style={i === kIdx ? KEY_ROW : { background: 'transparent' }}>
              {order.map(k => cell[k])}
            </ListRow>
          );
        })}
      </ListTable>
      {!rows.length ? <EmptyState icon="filter-x" title="No code reviews match these filters" text="Try a different status or scope, or remove a filter above." /> : null}
      <Pagination pg={pg} onPage={p => { go({ page: p }); window.scrollTo(0, 0); }} />
    </div>
  );
}
