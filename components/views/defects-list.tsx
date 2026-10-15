'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DST, DST_KEYS, MIG, PS, SEV, SEVORD, UM } from '@/lib/constants';
import { addD, fDate, nowStr, short, TNOW } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av, engineerOptions } from '@/lib/people';
import { affLabel, affLines, affModels, thumbOf } from '@/lib/products';
import { A, firstRes, isOpen, lastAt, migOf, tgtEval } from '@/lib/records';
import { updDefects, useApp } from '@/lib/store';
import type { Defect, DefectStatus, Option, Severity } from '@/lib/types';
import { EmptyState, Loading, PageHeader, Pagination, pagerOf, QuickFilters, ScopeTabs, SortHeader, StatusLabel, Thumb } from '../common/basics';
import { Clickable, stop } from '../common/clickable';
import { useKeyRows, useShell } from '../shell/shell-context';
import { Button, LinkButton } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Input } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Select } from '../ui/select';
import { Checkbox } from '../ui/toggles';

const HLBG = 'oklch(0.975 0.018 293)', HLSH = 'inset 3px 0 0 oklch(0.55 0.19 293)';
export const rangeChip = (pre: string, f?: string | null, t?: string | null) => `${pre} ${f ? short(f) : '…'} – ${t ? short(addD(t, -1)) : 'now'}`;

export const sevOptions = (): Option[] => [...SEVORD].reverse().map(k => ({ value: k, label: SEV[k].l, icon: SEV[k].icon, color: SEV[k].c }));
export const dStatusOptions = (): Option[] => DST_KEYS.map(k => ({ value: k, label: DST[k].l, icon: DST[k].icon, color: DST[k].fg }));

export function DefectsList() {
  const app = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const { ui, setUi, kIdx, setKIdx, contentW, flash } = useShell();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);

  // Links from email digests can ask for a scope, e.g. "Assigned to you".
  useEffect(() => {
    const s = sp.get('scope');
    if (s) {
      setUi({ dScope: s });
      router.replace('/defects');
    }
  }, [sp, setUi, router]);

  const qf = useMemo(() => Object.fromEntries([...sp.entries()].filter(([k]) => k !== 'scope')), [sp]);
  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';

  const view = useMemo(() => {
    if (!data || !prefs) return null;
    const dq = qf;
    const dqF = (d: Defect) => {
      if (dq.model && !affModels(d).includes(dq.model)) return false;
      if (dq.sev && d.sev !== dq.sev) return false;
      if (dq.open && !isOpen(d)) return false;
      if (dq.mig && migOf(d) !== dq.mig) return false;
      if (dq.comp && d.comp !== dq.comp) return false;
      if (dq.line && !affLines(d).includes(dq.line)) return false;
      if (dq.late && !(isOpen(d) && tgtEval(d, TNOW).f.late)) return false;
      if (dq.from || dq.to) {
        const t = dq.by === 'resolved' ? firstRes(d) : d.created;
        if (!t) return false;
        if (dq.from && t < dq.from) return false;
        if (dq.to && t >= dq.to) return false;
      }
      return true;
    };
    const chips = [
      dq.model, dq.sev && SEV[dq.sev as Severity]?.l, dq.open && 'Open or in progress', dq.comp, dq.line && dq.line + ' line',
      dq.mig && MIG[dq.mig as keyof typeof MIG]?.l, dq.late && 'Past resolution target',
      (dq.from || dq.to) && rangeChip(dq.by === 'resolved' ? 'Resolved' : 'Created', dq.from, dq.to)
    ].filter((x): x is string => !!x);
    const Dq = data.defects.filter(dqF);
    const scopeF: Record<string, (d: Defect) => boolean> = {
      all: () => true, mine: d => d.assignees.includes(meId), reported: d => d.reporter === meId, subscribed: d => isSubscribed(prefs.subs, d, meId)
    };
    const scope = scopeF[ui.dScope] ? ui.dScope : 'all';
    const inScope = Dq.filter(scopeF[scope]);
    const ql = q.trim().toLowerCase();
    const get: Record<string, (d: Defect) => string | number> = {
      id: d => d.id, title: d => d.title.toLowerCase(), sev: d => SEVORD.indexOf(d.sev), status: d => DST_KEYS.indexOf(d.status), updated: d => lastAt(d)
    };
    const st = ui.dSort;
    const all = inScope
      .filter(d => ui.dStatus === 'all' || d.status === ui.dStatus)
      .filter(d => !ql || (d.id + ' ' + d.title + ' ' + d.model + ' ' + d.comp).toLowerCase().includes(ql))
      .map(d => ({ d, k: get[st.k](d) }))
      .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0) * st.d)
      .map(x => x.d);
    return {
      chips, all, scope,
      scopes: [['all', 'All', 'layers'], ['mine', 'Assigned to me', 'user-check'], ['reported', 'Reported by me', 'flag'], ['subscribed', 'Subscribed', 'bell']].map(([k, label, icon]) => ({ k, label, icon, count: Dq.filter(scopeF[k]).length })),
      statuses: [{ value: 'all', label: 'All statuses', icon: 'layers', count: inScope.length }, ...DST_KEYS.map(k => ({ value: k, label: DST[k].l, icon: DST[k].icon, color: DST[k].fg, count: inScope.filter(d => d.status === k).length }))] as Option[]
    };
  }, [data, prefs, qf, ui.dScope, ui.dStatus, ui.dSort, q, meId]);

  const pg = pagerOf(view ? view.all.length : 0, page, PS);
  const rows = view ? view.all.slice((pg.p - 1) * PS, pg.p * PS) : [];
  const toggle = (id: string, v: boolean) => setSel(s => (v ? [...new Set([...s, id])] : s.filter(x => x !== id)));
  useKeyRows(rows.map(d => ({ open: () => router.push('/defects/' + d.id), toggle: (v: boolean) => toggle(d.id, v), checked: sel.includes(d.id) })), () => setSel([]));
  const engItems = useMemo(() => engineerOptions(), []);
  if (!view) return <Loading />;

  const compact = contentW > 0 && contentW < 1100;
  const cols = compact ? '18px 100px minmax(0,1fr) 104px 124px 112px' : '18px 56px 100px minmax(0,1fr) 104px 124px 112px 72px';
  const onSort = (k: string) => { setUi(u => ({ dSort: u.dSort.k === k ? { k, d: (-u.dSort.d) as 1 | -1 } : { k, d: k === 'updated' ? -1 : 1 } })); setPage(1); setKIdx(-1); };
  const allChecked = rows.length > 0 && rows.every(d => sel.includes(d.id));
  const bulk = (fn: (d: Defect) => Defect, msg: (n: number) => string) => {
    updDefects(new Set(sel), fn);
    flash(msg(sel.length));
  };
  const at = nowStr;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <PageHeader title="Defects" sub="Issues reported against printer and copier models" action={<LinkButton href="/defects/new" variant="primary" icon="plus">Report defect</LinkButton>} />
      <ScopeTabs scopes={view.scopes} value={view.scope} onChange={k => { setUi({ dScope: k }); setPage(1); setKIdx(-1); }} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted">Status</span>
        <div className="w-[260px] max-w-full">
          <Select ariaLabel="Status" items={view.statuses} value={ui.dStatus} onValueChange={v => { setUi({ dStatus: v }); setPage(1); setKIdx(-1); }} />
        </div>
        <div className="ml-auto w-[260px] max-w-full">
          <Input id="listsearch" icon="search" ariaLabel="Search defects" value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search ID, title, model" />
        </div>
      </div>
      <QuickFilters chips={view.chips} clearHref="/defects" />
      {sel.length ? (
        <div className="flex flex-wrap items-center gap-3 border-l-[3px] border-accent-bar py-2 pl-4">
          <span className="mr-1 font-[650] text-accent-ink">{sel.length} selected</span>
          <div className="w-[190px]">
            <Select ariaLabel="Set status" items={dStatusOptions()} value={null} placeholder="Set status" onValueChange={v => bulk(x => (x.status === v ? x : { ...x, status: v as DefectStatus, activity: [...x.activity, A('e', meId, at(), 'changed status to ' + DST[v as DefectStatus].l)] }), n => `${n} defects set to ${DST[v as DefectStatus].l}`)} />
          </div>
          <div className="w-[170px]">
            <Select ariaLabel="Set severity" items={sevOptions()} value={null} placeholder="Set severity" onValueChange={v => bulk(x => (x.sev === v ? x : { ...x, sev: v as Severity, activity: [...x.activity, A('e', meId, at(), 'changed severity to ' + SEV[v as Severity].l)] }), n => `${n} defects set to ${SEV[v as Severity].l}`)} />
          </div>
          <div className="w-[220px]">
            <Combobox items={engItems} value={null} placeholder="Add assignee" leadIcon="user-plus" resetOnSelect onValueChange={v => { if (v) bulk(x => (x.assignees.includes(v) ? x : { ...x, assignees: [...x.assignees, v], activity: [...x.activity, A('e', meId, at(), 'assigned ' + UM[v].name)] }), n => `${UM[v].name} assigned to ${n} defects`); }} />
          </div>
          <Button variant="ghost" size="sm" icon="x" onClick={() => setSel([])}>Clear selection</Button>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <div style={{ minWidth: compact ? 760 : 1016 }}>
          <div className="grid items-center gap-5 border-b border-line py-3 text-sm font-semibold text-muted" style={{ gridTemplateColumns: cols }}>
            <div className="flex items-center" onClick={stop}>
              <Checkbox ariaLabel="Select all on this page" checked={allChecked} onCheckedChange={v => { const ids = rows.map(d => d.id); setSel(s => (v ? [...new Set([...s, ...ids])] : s.filter(x => !ids.includes(x)))); }} />
            </div>
            {!compact ? <span /> : null}
            <SortHeader label="ID" k="id" sort={ui.dSort} onSort={onSort} />
            <SortHeader label="Title" k="title" sort={ui.dSort} onSort={onSort} />
            <SortHeader label="Severity" k="sev" sort={ui.dSort} onSort={onSort} />
            <SortHeader label="Status" k="status" sort={ui.dSort} onSort={onSort} />
            <span>Assignees</span>
            {!compact ? <SortHeader label="Updated" k="updated" sort={ui.dSort} onSort={onSort} style={{ justifyContent: 'flex-end', width: '100%' }} /> : null}
          </div>
          <div className="flex flex-col">
            {rows.map((d, i) => {
              const ck = sel.includes(d.id);
              const c = d.activity.filter(a => a.t === 'c').length, n = (d.attachments || []).length;
              const meta = [affLabel(d), d.comp, c ? `${c} comment${c > 1 ? 's' : ''}` : '', n ? `${n} attachment${n > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
              return (
                <Clickable
                  key={d.id}
                  href={'/defects/' + d.id}
                  krow={i}
                  className="row-link grid items-center gap-5 border-b border-line-soft py-4 last:border-b-0"
                  style={{ gridTemplateColumns: cols, background: i === kIdx ? HLBG : ck ? 'oklch(0.982 0.012 293)' : 'transparent', boxShadow: i === kIdx ? HLSH : 'none' }}
                >
                  <div className="flex items-center" onClick={stop}>
                    <Checkbox ariaLabel={'Select ' + d.id} checked={ck} onCheckedChange={v => toggle(d.id, v)} />
                  </div>
                  {!compact ? <Thumb th={thumbOf(d.model)} /> : null}
                  <span className="font-mono text-sm text-muted">{d.id}</span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="bui-trunc font-[550]">{d.title}</span>
                    <span className="bui-trunc text-sm text-muted">{meta}</span>
                  </div>
                  <span className="flex items-center gap-2"><Icon name={SEV[d.sev].icon} color={SEV[d.sev].c} size={16} />{SEV[d.sev].l}</span>
                  <StatusLabel {...DST[d.status]} />
                  <div className="flex items-center gap-1">
                    {d.assignees.slice(0, 3).map(u => <Person key={u} person={av(u)} size={28} />)}
                    {!d.assignees.length ? <span className="text-sm text-faint">Unassigned</span> : null}
                  </div>
                  {!compact ? <span className="text-right text-sm text-muted tabular-nums">{fDate(lastAt(d))}</span> : null}
                </Clickable>
              );
            })}
          </div>
          {!rows.length ? <EmptyState icon="filter-x" title="No defects match these filters" text="Try a different status or scope, or remove a filter above." /> : null}
        </div>
      </div>
      <Pagination pg={pg} onPage={p => { setPage(p); setKIdx(-1); window.scrollTo(0, 0); }} />
    </div>
  );
}
