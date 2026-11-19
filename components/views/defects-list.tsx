import { useNavigate, useSearchParams } from 'react-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { DST, DST_KEYS, MIG, PS, SEV, SEVORD, UM } from '@/lib/constants';
import { addD, fDate, nowStr, short, TNOW } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av, engineerOptions } from '@/lib/people';
import { affLabel, affLines, affModels, thumbOf } from '@/lib/products';
import { A, firstRes, isOpen, lastAt, migOf, tgtEval } from '@/lib/records';
import { updDefects, useApp } from '@/lib/store';
import { langOf, plural } from '@/lib/text';
import type { Defect, DefectStatus, Option, Severity } from '@/lib/types';
import { EmptyState, Loading, PageHeader, Pagination, pagerOf, QuickFilters, ScopeTabs, StatusLabel, Thumb } from '../common/basics';
import { KEY_ROW } from '../common/clickable';
import { Cell, type Col, ListRow, type ListState, ListTable, LIST_KEYS, RowLink, useListState } from '../common/list-table';
import { useKeyRows, useShell } from '../shell/shell-context';
import { Button, LinkButton } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Input } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Select } from '../ui/select';
import { Checkbox } from '../ui/toggles';
import { cx } from '@/lib/cx';
import s from './defects-list.module.css';

export const rangeChip = (pre: string, f?: string | null, t?: string | null) =>
  !f ? `${pre} until ${short(addD(t || '', -1))}` : `${pre} ${short(f)} - ${t ? short(addD(t, -1)) : 'now'}`;

export const sevOptions = (): Option[] => [...SEVORD].reverse().map(k => ({ value: k, label: SEV[k].l, icon: SEV[k].icon, color: SEV[k].c }));
export const dStatusOptions = (): Option[] => DST_KEYS.map(k => ({ value: k, label: DST[k].l, icon: DST[k].icon, color: DST[k].fg }));

export function DefectsList() {
  const app = useApp();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { ui, setUi, kIdx, setKIdx, contentW, flash } = useShell();
  const [ls, setLs] = useListState(
    { scope: ui.dScope, status: ui.dStatus, sort: ui.dSort },
    useCallback((s: ListState) => setUi({ dScope: s.scope, dStatus: s.status, dSort: s.sort }), [setUi])
  );
  const [sel, setSel] = useState<string[]>([]);

  const qf = useMemo(() => Object.fromEntries([...sp.entries()].filter(([k]) => !LIST_KEYS.includes(k))), [sp]);
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
    const scope = scopeF[ls.scope] ? ls.scope : 'all';
    const inScope = Dq.filter(scopeF[scope]);
    const ql = ls.q.trim().toLowerCase();
    const get: Record<string, (d: Defect) => string | number> = {
      id: d => d.id, title: d => d.title.toLowerCase(), sev: d => SEVORD.indexOf(d.sev), status: d => DST_KEYS.indexOf(d.status), updated: d => lastAt(d)
    };
    const st = get[ls.sort.k] ? ls.sort : { k: 'updated', d: -1 };
    const all = inScope
      .filter(d => ls.status === 'all' || d.status === ls.status)
      .filter(d => !ql || (d.id + ' ' + d.title + ' ' + d.model + ' ' + d.comp).toLowerCase().includes(ql))
      .map(d => ({ d, k: get[st.k](d) }))
      .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0) * st.d)
      .map(x => x.d);
    return {
      chips, all, scope,
      scopes: [['all', 'All', 'layers'], ['mine', 'Assigned to me', 'user-check'], ['reported', 'Reported by me', 'flag'], ['subscribed', 'Subscribed', 'bell']].map(([k, label, icon]) => ({ k, label, icon, count: Dq.filter(scopeF[k]).length })),
      statuses: [{ value: 'all', label: 'All statuses', icon: 'layers', count: inScope.length }, ...DST_KEYS.map(k => ({ value: k, label: DST[k].l, icon: DST[k].icon, color: DST[k].fg, count: inScope.filter(d => d.status === k).length }))] as Option[]
    };
  }, [data, prefs, qf, ls, meId]);

  const pg = pagerOf(view ? view.all.length : 0, ls.page, PS);
  const rows = view ? view.all.slice((pg.p - 1) * PS, pg.p * PS) : [];
  const toggle = (id: string, v: boolean) => setSel(s => (v ? [...new Set([...s, id])] : s.filter(x => x !== id)));
  useKeyRows(rows.map(d => ({ open: () => navigate('/defects/' + d.id), toggle: (v: boolean) => toggle(d.id, v), checked: sel.includes(d.id) })), () => setSel([]));
  const engItems = useMemo(() => engineerOptions(), []);
  if (!view) return <Loading />;

  const cards = contentW > 0 && contentW < 640, compact = contentW > 0 && contentW < 1100;
  const template = cards ? '18px minmax(0,1fr) auto auto' : compact ? '18px 100px minmax(0,1fr) 104px 124px 112px' : '18px 56px 100px minmax(0,1fr) 104px 124px 112px 72px';
  const areas = cards ? '"ck id sev st" "ck title title title" "ck as as upd"' : undefined;
  const cols: Col[] = [
    ...(compact ? [] : [{ key: 'thumb', label: 'Model photo', hidden: true }]),
    { key: 'id', label: 'ID', sort: 'id' }, { key: 'title', label: 'Title', sort: 'title' }, { key: 'sev', label: 'Severity', sort: 'sev' },
    { key: 'status', label: 'Status', sort: 'status' }, { key: 'as', label: 'Assignees' },
    ...(compact && !cards ? [] : [{ key: 'updated', label: 'Updated', sort: 'updated', align: 'end' as const }])
  ];
  const go = (patch: Partial<ListState>) => { setLs(patch); setKIdx(-1); };
  const allChecked = rows.length > 0 && rows.every(d => sel.includes(d.id));
  const selectAll = <Checkbox ariaLabel="Select all on this page" checked={allChecked} onCheckedChange={v => { const ids = rows.map(d => d.id); setSel(s => (v ? [...new Set([...s, ...ids])] : s.filter(x => !ids.includes(x)))); }} />;
  const bulk = (fn: (d: Defect) => Defect, msg: (n: number) => string) => {
    updDefects(new Set(sel), fn);
    flash(msg(sel.length));
  };
  const at = nowStr;
  const setStatus = (v: DefectStatus) => (x: Defect): Defect => {
    if (x.status === v) return x;
    const done = v === 'resolved' || v === 'closed';
    return { ...x, status: v, resolution: done ? x.resolution || 'fixed' : undefined, activity: [...x.activity, A('e', meId, at(), 'changed status to ' + DST[v].l)] };
  };

  return (
    <div className={cx(s.page, sel.length > 0 && s.pageSelecting)}>
      <PageHeader title="Defects" sub="Issues reported against printer and copier models" action={<LinkButton href="/defects/new" variant="primary" icon="plus">Report defect</LinkButton>} />
      <ScopeTabs scopes={view.scopes} value={view.scope} onChange={k => go({ scope: k })} />
      <div className={s.filters}>
        <span className={s.filterLabel}>Status</span>
        <div className={s.statusFilter}>
          <Select ariaLabel="Status" items={view.statuses} value={ls.status} onValueChange={v => go({ status: v })} />
        </div>
        <div className={s.search}>
          <Input id="listsearch" icon="search" ariaLabel="Search defects" value={ls.q} onChange={v => setLs({ q: v })} placeholder="Search ID, title, model" />
        </div>
      </div>
      <QuickFilters chips={view.chips} clearHref="/defects" />
      <ListTable label="Defects" cols={cols} template={template} sort={ls.sort} onSort={s => go({ sort: s })} cards={cards} minWidth={compact ? 760 : 1016} lead={selectAll}>
        {rows.map((d, i) => {
          const ck = sel.includes(d.id);
          const c = d.activity.filter(a => a.t === 'c').length, n = (d.attachments || []).length;
          const meta = [affLabel(d), d.comp, c ? plural(c, 'comment') : '', n ? plural(n, 'attachment') : ''].filter(Boolean).join(', ');
          return (
            <ListRow key={d.id} krow={i} template={template} areas={areas} style={i === kIdx ? KEY_ROW : { background: ck ? 'oklch(0.982 0.012 293)' : 'transparent' }}>
              <Cell area={cards ? 'ck' : undefined} className={s.checkCell}>
                <Checkbox ariaLabel={'Select ' + d.id} checked={ck} onCheckedChange={v => toggle(d.id, v)} />
              </Cell>
              {!compact ? <Cell><Thumb th={thumbOf(d.model)} /></Cell> : null}
              <Cell area={cards ? 'id' : undefined}><RowLink href={'/defects/' + d.id}>{d.id}</RowLink></Cell>
              <Cell area={cards ? 'title' : undefined} className={s.titleCell}>
                <span lang={langOf(d.title)} className={cx(s.title, cards ? s.titleClamp : 'bui-trunc')}>{d.title}</span>
                <span className={cx('bui-trunc', s.meta)}>{meta}</span>
              </Cell>
              <Cell area={cards ? 'sev' : undefined} className={s.sevCell}><Icon name={SEV[d.sev].icon} color={SEV[d.sev].c} size={16} />{SEV[d.sev].l}</Cell>
              <Cell area={cards ? 'st' : undefined}><StatusLabel {...DST[d.status]} /></Cell>
              <Cell area={cards ? 'as' : undefined} className={s.assignees}>
                {d.assignees.slice(0, 3).map(u => <Person key={u} person={av(u)} size={cards ? 24 : 28} />)}
                {!d.assignees.length ? <span className={s.unassigned}>Unassigned</span> : null}
              </Cell>
              {!compact || cards ? <Cell area={cards ? 'upd' : undefined} className={s.updated}>{cards ? 'Updated ' : ''}{fDate(lastAt(d))}</Cell> : null}
            </ListRow>
          );
        })}
      </ListTable>
      {!rows.length ? <EmptyState icon="filter-x" title="No defects match these filters" text="Try a different status or scope, or remove a filter above" /> : null}
      <Pagination pg={pg} onPage={p => { go({ page: p }); window.scrollTo(0, 0); }} />
      {sel.length ? (
        <BulkBar count={sel.length} onClear={() => setSel([])}>
          <div className={s.bulkStatus}>
            <Select ariaLabel="Set status" items={dStatusOptions()} value={null} placeholder="Set status" onValueChange={v => bulk(setStatus(v as DefectStatus), n => `${plural(n, 'defect')} set to ${DST[v as DefectStatus].l}`)} />
          </div>
          <div className={s.bulkSeverity}>
            <Select ariaLabel="Set severity" items={sevOptions()} value={null} placeholder="Set severity" onValueChange={v => bulk(x => (x.sev === v ? x : { ...x, sev: v as Severity, activity: [...x.activity, A('e', meId, at(), 'changed severity to ' + SEV[v as Severity].l)] }), n => `${plural(n, 'defect')} set to ${SEV[v as Severity].l}`)} />
          </div>
          <div className={s.bulkAssignee}>
            <Combobox items={engItems} value={null} placeholder="Add assignee" leadIcon="user-plus" resetOnSelect onValueChange={v => { if (v) bulk(x => (x.assignees.includes(v) ? x : { ...x, assignees: [...x.assignees, v], activity: [...x.activity, A('e', meId, at(), 'assigned ' + UM[v].name)] }), n => `${UM[v].name} assigned to ${plural(n, 'defect')}`); }} />
          </div>
        </BulkBar>
      ) : null}
    </div>
  );
}

/** Actions for the selected rows, floating at the bottom so the list does not move. */
export function BulkBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  return (
    <div role="toolbar" aria-label="Bulk edit" className={s.bulkBar}>
      <span className={s.bulkCount}>{count} selected</span>
      {children}
      <Button variant="ghost" size="sm" icon="x" onClick={onClear}>Clear</Button>
    </div>
  );
}
