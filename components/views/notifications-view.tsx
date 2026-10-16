'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PS } from '@/lib/constants';
import { fAt, nowStr } from '@/lib/dates';
import { buildNotifs, isUnread, readOf } from '@/lib/notifications';
import { av } from '@/lib/people';
import { setRead, useApp } from '@/lib/store';
import { EmptyState, Loading, PageHeader, Pagination, pagerOf } from '../common/basics';
import { Clickable, KEY_ROW } from '../common/clickable';
import { useKeyRows, useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Segmented } from '../ui/toggles';


export function NotificationsView() {
  const app = useApp();
  const router = useRouter();
  const { ui, setUi, kIdx, setKIdx, flash } = useShell();
  const [page, setPage] = useState(1);
  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';
  const nl = useMemo(() => (data && prefs ? buildNotifs(data, meId, prefs.subs) : []), [data, prefs, meId]);
  const rd = prefs ? readOf(prefs.read, meId) : { all: '', ids: [] };
  const f = ui.nFilter;
  const fl = nl.filter(n => f === 'all' || (f === 'unread' ? isUnread(n, rd) : n.kind === 'mention'));
  const unread = nl.filter(n => isUnread(n, rd)).length;
  const pg = pagerOf(fl.length, page, PS);
  const rows = fl.slice((pg.p - 1) * PS, pg.p * PS);
  const open = (n: (typeof nl)[number]) => {
    if (isUnread(n, rd)) setRead(meId, { ids: [...rd.ids, n.id] });
    router.push(n.href);
  };
  useKeyRows(rows.map(n => ({ open: () => open(n) })));
  if (!app) return <Loading />;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-7">
      <PageHeader
        title="Notifications"
        sub={unread ? unread + ' unread' : 'All caught up'}
        action={unread ? (
          <Button variant="secondary" icon="check-check" onClick={() => { setRead(meId, { all: nl.length && nl[0].at > nowStr() ? nl[0].at : nowStr(), ids: [] }); flash('All notifications marked as read'); }}>
            Mark all as read
          </Button>
        ) : null}
      />
      <div className="max-w-full overflow-x-auto">
        <Segmented
          ariaLabel="Filter"
          items={[{ value: 'all', label: 'All', count: nl.length }, { value: 'unread', label: 'Unread', count: unread }, { value: 'mention', label: 'Mentions', icon: 'at-sign', count: nl.filter(n => n.kind === 'mention').length }]}
          value={f}
          onValueChange={v => { setUi({ nFilter: v }); setPage(1); setKIdx(-1); }}
        />
      </div>
      <div className="flex flex-col border-t border-line">
        {rows.map((n, i) => {
          const un = isUnread(n, rd), who = av(n.u);
          return (
            <Clickable
              key={n.id}
              onOpen={() => open(n)}
              krow={i}
              className="row-link grid grid-cols-[8px_32px_minmax(0,1fr)_auto] items-start gap-3.5 border-b border-line-soft py-4 pr-3 pl-2 last:border-b-0"
              style={i === kIdx ? KEY_ROW : { background: un ? 'oklch(0.985 0.012 293)' : 'transparent' }}
            >
              <span className="mt-3 h-2 w-2 rounded-full" style={{ background: un ? 'oklch(0.55 0.19 293)' : 'transparent' }} aria-label={un ? 'Unread' : undefined} />
              <Person person={who} size={32} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2"><strong className="font-semibold">{who.name}</strong><span className="text-ink-4">{n.verb}</span><span className="font-mono text-sm">{n.itemId}</span></span>
                <span className="bui-trunc" style={{ fontWeight: un ? 600 : 400 }}>{n.title}</span>
                {n.text ? <span className="line-clamp-2 leading-[1.6] text-muted">{n.text}</span> : null}
              </div>
              <span className="flex items-center gap-2 text-sm whitespace-nowrap text-muted"><Icon name={n.icon} size={14} />{fAt(n.at)}</span>
            </Clickable>
          );
        })}
        {!fl.length ? <EmptyState icon="bell" title="You're all caught up" text="Mentions, assignments and review decisions will show up here." /> : null}
      </div>
      <Pagination pg={pg} onPage={p => { setPage(p); setKIdx(-1); window.scrollTo(0, 0); }} />
    </div>
  );
}
