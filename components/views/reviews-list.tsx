'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DEC, PS, RST, RST_KEYS, TYPE_ICON, UM } from '@/lib/constants';
import { fDate } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av } from '@/lib/people';
import { rModelId, thumbOf } from '@/lib/products';
import { firstDec, lastAt } from '@/lib/records';
import { useApp } from '@/lib/store';
import type { Option, Review } from '@/lib/types';
import { EmptyState, Loading, PageHeader, Pagination, pagerOf, QuickFilters, ScopeTabs, SortHeader, StatusLabel, Thumb } from '../common/basics';
import { Clickable } from '../common/clickable';
import { useKeyRows, useShell } from '../shell/shell-context';
import { LinkButton } from '../ui/button';
import { Input } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Select } from '../ui/select';
import { rangeChip } from './defects-list';

const HLBG = 'oklch(0.975 0.018 293)', HLSH = 'inset 3px 0 0 oklch(0.55 0.19 293)';

export function ReviewsList() {
  const app = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const { ui, setUi, kIdx, setKIdx, contentW } = useShell();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const qf = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
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
    const scope = scopeF[ui.rScope] ? ui.rScope : 'all';
    const inScope = Rq.filter(scopeF[scope]);
    const ql = q.trim().toLowerCase();
    const get: Record<string, (r: Review) => string | number> = {
      id: r => r.id, title: r => r.title.toLowerCase(), type: r => r.type, author: r => UM[r.author].en, status: r => RST_KEYS.indexOf(r.status), updated: r => lastAt(r)
    };
    const st = ui.rSort;
    const all = inScope
      .filter(r => ui.rStatus === 'all' || r.status === ui.rStatus)
      .filter(r => !ql || (r.id + ' ' + r.title + ' ' + r.branch).toLowerCase().includes(ql))
      .map(r => ({ r, k: get[st.k](r) }))
      .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0) * st.d)
      .map(x => x.r);
    return {
      chips, all, scope,
      scopes: [['all', 'All', 'layers'], ['mine', 'My requests', 'git-pull-request'], ['reviewing', 'Assigned to me', 'user-check'], ['subscribed', 'Subscribed', 'bell']].map(([k, label, icon]) => ({ k, label, icon, count: Rq.filter(scopeF[k]).length })),
      statuses: [{ value: 'all', label: 'All statuses', icon: 'layers', count: inScope.length }, ...RST_KEYS.map(k => ({ value: k, label: RST[k].l, icon: RST[k].icon, color: RST[k].fg, count: inScope.filter(r => r.status === k).length }))] as Option[]
    };
  }, [data, prefs, qf, ui.rScope, ui.rStatus, ui.rSort, q, meId]);

  const pg = pagerOf(view ? view.all.length : 0, page, PS);
  const rows = view ? view.all.slice((pg.p - 1) * PS, pg.p * PS) : [];
  useKeyRows(rows.map(r => ({ open: () => router.push('/reviews/' + r.id) })));
  if (!view || !data) return <Loading />;

  const compact = contentW > 0 && contentW < 1100;
  const cols = compact ? '76px minmax(0,1fr) 150px 190px' : '56px 76px minmax(0,1fr) 140px 150px 150px 190px 72px';
  const onSort = (k: string) => { setUi(u => ({ rSort: u.rSort.k === k ? { k, d: (-u.rSort.d) as 1 | -1 } : { k, d: k === 'updated' ? -1 : 1 } })); setPage(1); setKIdx(-1); };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <PageHeader title="Code reviews" sub="Every code change is reviewed by the code review team before it is submitted" action={<LinkButton href="/reviews/new" variant="primary" icon="git-pull-request">Request review</LinkButton>} />
      <ScopeTabs scopes={view.scopes} value={view.scope} onChange={k => { setUi({ rScope: k }); setPage(1); setKIdx(-1); }} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted">Status</span>
        <div className="w-[260px] max-w-full">
          <Select ariaLabel="Status" items={view.statuses} value={ui.rStatus} onValueChange={v => { setUi({ rStatus: v }); setPage(1); setKIdx(-1); }} />
        </div>
        <div className="ml-auto w-[260px] max-w-full">
          <Input id="listsearch" icon="search" ariaLabel="Search code reviews" value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search ID, title, branch" />
        </div>
      </div>
      <QuickFilters chips={view.chips} clearHref="/reviews" />
      <div className="overflow-x-auto">
        <div style={{ minWidth: compact ? 680 : 1116 }}>
          <div className="grid gap-5 border-b border-line py-3 text-sm font-semibold text-muted" style={{ gridTemplateColumns: cols }}>
            {!compact ? <span /> : null}
            <SortHeader label="ID" k="id" sort={ui.rSort} onSort={onSort} />
            <SortHeader label="Change" k="title" sort={ui.rSort} onSort={onSort} />
            {!compact ? <SortHeader label="Type" k="type" sort={ui.rSort} onSort={onSort} /> : null}
            <SortHeader label="Author" k="author" sort={ui.rSort} onSort={onSort} />
            {!compact ? <span>Reviewers</span> : null}
            <SortHeader label="Status" k="status" sort={ui.rSort} onSort={onSort} />
            {!compact ? <SortHeader label="Updated" k="updated" sort={ui.rSort} onSort={onSort} style={{ justifyContent: 'flex-end', width: '100%' }} /> : null}
          </div>
          <div className="flex flex-col">
            {rows.map((r, i) => {
              const n = r.reviewers.length, ap = r.reviewers.filter(v => v.dec === 'approved').length, author = av(r.author);
              return (
                <Clickable
                  key={r.id}
                  href={'/reviews/' + r.id}
                  krow={i}
                  className="row-link grid items-center gap-5 border-b border-line-soft py-4 last:border-b-0"
                  style={{ gridTemplateColumns: cols, background: i === kIdx ? HLBG : 'transparent', boxShadow: i === kIdx ? HLSH : 'none' }}
                >
                  {!compact ? <Thumb th={thumbOf(rModelId(r, data.defects))} /> : null}
                  <span className="font-mono text-sm text-muted">{r.id}</span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="bui-trunc font-[550]">{r.title}</span>
                    <span className="bui-trunc font-mono text-sm text-muted">{'//depot/printing/' + r.branch}</span>
                  </div>
                  {!compact ? <span className="flex items-center gap-2 whitespace-nowrap"><Icon name={TYPE_ICON[r.type]} color="var(--color-muted)" size={16} />{r.type}</span> : null}
                  <span className="flex min-w-0 items-center gap-2.5"><Person person={author} size={26} /><span className="bui-trunc">{author.name}</span></span>
                  {!compact ? (
                    <span className="flex min-w-0 items-center gap-2.5">
                      {n ? (
                        <>
                          <span className="flex flex-none gap-1">{r.reviewers.slice(0, 3).map(v => <Person key={v.u} person={av(v.u)} size={26} />)}</span>
                          <span className="bui-trunc">{n === 1 ? UM[r.reviewers[0].u].name : `${ap}/${n} approved`}</span>
                        </>
                      ) : (
                        <span className="text-faint">Not assigned</span>
                      )}
                    </span>
                  ) : null}
                  <StatusLabel {...RST[r.status]} />
                  {!compact ? <span className="text-right text-sm text-muted tabular-nums">{fDate(lastAt(r))}</span> : null}
                </Clickable>
              );
            })}
          </div>
          {!rows.length ? <EmptyState icon="filter-x" title="No code reviews match these filters" text="Try a different status or scope, or remove a filter above." /> : null}
        </div>
      </div>
      <Pagination pg={pg} onPage={p => { setPage(p); setKIdx(-1); window.scrollTo(0, 0); }} />
    </div>
  );
}
