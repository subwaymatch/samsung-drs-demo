'use client';

import NextLink from 'next/link';
import { useMemo } from 'react';
import { DEC, DST, MUTED, ROLE, RST, SEV, TM, TYPE_ICON, UM } from '@/lib/constants';
import { fAt } from '@/lib/dates';
import { isActiveReview, isOpen } from '@/lib/records';
import { useApp } from '@/lib/store';
import { Loading, Note, PhotoPlaceholder, StatusLabel } from '../common/basics';
import { Clickable } from '../common/clickable';
import { Icon } from '../ui/icon';
import { NotFoundView } from './not-found-view';

export function ProfileView({ id }: { id: string }) {
  const app = useApp();
  const u = UM[id];
  const v = useMemo(() => {
    if (!app || !u) return null;
    const D = app.data.defects, R = app.data.reviews;
    const openD = D.filter(x => x.assignees.includes(id) && isOpen(x));
    const revs = R.filter(x => (x.author === id || x.reviewers.some(r => r.u === id)) && isActiveReview(x));
    const acts = [
      ...D.flatMap(o => o.activity.filter(x => x.u === id).map(x => ({ x, o, p: '/defects/' }))),
      ...R.flatMap(o => o.activity.filter(x => x.u === id).map(x => ({ x, o, p: '/reviews/' })))
    ].sort((p, q) => (p.x.at < q.x.at ? 1 : -1)).slice(0, 10);
    const counts = {
      reported: D.filter(x => x.reporter === id).length,
      assigned: D.filter(x => x.assignees.includes(id)).length,
      authored: R.filter(x => x.author === id).length,
      reviewed: R.filter(x => x.activity.some(a => a.t === 'd' && a.u === id)).length
    };
    return { openD, revs, acts, counts };
  }, [app, id, u]);
  if (!app) return <Loading />;
  if (!u || !v) return <NotFoundView text="This person is not in the directory." />;
  const stats = [
    u.role === 'qa' ? { l: 'Defects reported', n: v.counts.reported } : null,
    u.role === 'eng' ? { l: 'Defects assigned', n: v.counts.assigned } : null,
    u.role !== 'cr' ? { l: 'Reviews requested', n: v.counts.authored } : null,
    u.role === 'cr' ? { l: 'Reviews decided', n: v.counts.reviewed } : null
  ].filter((x): x is { l: string; n: number } => !!x);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      <div className="flex items-center gap-2.5 text-muted">
        <NextLink href="/teams" className="bui-btn bui-link"><Icon name="arrow-left" size={16} />Teams</NextLink><span>/</span><span>{u.name}</span>
      </div>
      <div className="flex flex-wrap items-start gap-8">
        <PhotoPlaceholder w={160} h={200} iconSize={48} src={u.photo} title={u.photo ? u.name : 'Photo placeholder'} />
        <div className="flex max-w-[680px] min-w-0 flex-[1_1_360px] flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-[-0.02em]">{u.name}</h1>
            {u.en !== u.name ? <span className="text-muted">{u.en}</span> : null}
          </div>
          <span className="font-[550]">{u.title}</span>
          <span className="text-muted">{TM[u.team].name}, {ROLE[u.role]}, {u.site}</span>
          <a href={'mailto:' + u.email} className="flex w-max max-w-full items-center gap-2"><Icon name="mail" size={15} />{u.email}</a>
          <p className="mt-2 leading-[1.7] text-pretty text-ink-3">{u.intro}</p>
          {stats.length ? (
            <div className="mt-3 flex flex-wrap gap-6">
              {stats.map(s => (
                <div key={s.l} className="flex flex-col gap-1 border-l-2 border-accent-rule py-0.5 pl-4">
                  <span className="text-sm font-semibold text-muted">{s.l}</span>
                  <span className="text-xl font-bold tabular-nums">{s.n}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid gap-x-14 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]">
        <section className="flex flex-col border-t border-line pt-6">
          <h3 className="mb-2 text-base font-[650]">Open defects assigned ({v.openD.length})</h3>
          {v.openD.slice(0, 8).map(x => (
            <Clickable key={x.id} href={'/defects/' + x.id} className="row-link grid grid-cols-[16px_92px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-soft py-3 last:border-b-0">
              <Icon name={SEV[x.sev].icon} size={16} color={SEV[x.sev].c} />
              <span className="font-mono text-sm text-muted">{x.id}</span>
              <div className="flex min-w-0 flex-col gap-[3px]"><span className="bui-trunc font-[550]">{x.title}</span><span className="bui-trunc text-sm text-muted">{x.model}, {x.comp}</span></div>
              <StatusLabel {...DST[x.status]} size={14} className="gap-1.5" />
            </Clickable>
          ))}
          {!v.openD.length ? <span className="pt-2 text-muted">No open defects assigned.</span> : null}
        </section>
        <section className="flex flex-col border-t border-line pt-6">
          <h3 className="mb-2 text-base font-[650]">Active code reviews ({v.revs.length})</h3>
          {v.revs.slice(0, 8).map(x => (
            <Clickable key={x.id} href={'/reviews/' + x.id} className="row-link grid grid-cols-[16px_92px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-soft py-3 last:border-b-0">
              <Icon name={TYPE_ICON[x.type]} size={16} color={MUTED} />
              <span className="font-mono text-sm text-muted">{x.id}</span>
              <div className="flex min-w-0 flex-col gap-[3px]"><span className="bui-trunc font-[550]">{x.title}</span><span className="bui-trunc text-sm text-muted">{(x.author === id ? 'Author' : 'Reviewer') + ', ' + x.type}</span></div>
              <StatusLabel {...RST[x.status]} size={14} className="gap-1.5" />
            </Clickable>
          ))}
          {!v.revs.length ? <span className="pt-2 text-muted">No active code reviews.</span> : null}
        </section>
      </div>
      <section className="flex flex-col pt-2">
        <h3 className="mb-2 text-base font-[650]">Recent activity</h3>
        {v.acts.map(({ x, o, p }, i) => (
          <Clickable key={o.id + i} href={p + o.id} className="row-link grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-soft py-3 last:border-b-0">
            <span className="font-mono text-sm text-muted">{o.id}</span>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="bui-trunc">{x.t === 'e' ? x.x.charAt(0).toUpperCase() + x.x.slice(1) : x.t === 'd' && x.dec ? DEC[x.dec] : 'Commented' + (x.loc ? ' on ' + x.loc : '')}</span>
              <span className="bui-trunc text-sm text-muted">{o.title}</span>
            </div>
            <span className="text-sm whitespace-nowrap text-muted">{fAt(x.at)}</span>
          </Clickable>
        ))}
        {!v.acts.length ? <Note className="mt-2" icon="clock" title="No activity yet" text="Defects, code reviews and comments from this person will show here." /> : null}
      </section>
    </div>
  );
}
