import { useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { PS } from '@/lib/constants';
import { fAt, nowStr } from '@/lib/dates';
import { buildNotifs, isUnread, readOf } from '@/lib/notifications';
import { av } from '@/lib/people';
import { setRead, useApp } from '@/lib/store';
import { cx } from '@/lib/cx';
import { EmptyState, Loading, PageHeader, Pagination, pagerOf } from '../common/basics';
import { Clickable, KEY_ROW } from '../common/clickable';
import { useKeyRows, useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Segmented } from '../ui/toggles';
import s from './notifications-view.module.css';


export function NotificationsView() {
  const app = useApp();
  const navigate = useNavigate();
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
  const markRead = (n: (typeof nl)[number]) => {
    if (isUnread(n, rd)) setRead(meId, { ids: [...rd.ids, n.id] });
  };
  const open = (n: (typeof nl)[number]) => {
    markRead(n);
    navigate(n.href);
  };
  useKeyRows(rows.map(n => ({ open: () => open(n) })));
  if (!app) return <Loading />;

  return (
    <div className={s.page}>
      <PageHeader
        title="Notifications"
        action={unread ? (
          <Button variant="secondary" icon="check-check" onClick={() => { setRead(meId, { all: nl.length && nl[0].at > nowStr() ? nl[0].at : nowStr(), ids: [] }); flash('All notifications marked as read'); }}>
            Mark all as read
          </Button>
        ) : null}
      />
      <div className={s.filter}>
        <Segmented
          ariaLabel="Filter"
          items={[{ value: 'all', label: 'All', count: nl.length }, { value: 'unread', label: 'Unread', count: unread }, { value: 'mention', label: 'Mentions', icon: 'at-sign', count: nl.filter(n => n.kind === 'mention').length }]}
          value={f}
          onValueChange={v => { setUi({ nFilter: v }); setPage(1); setKIdx(-1); }}
        />
      </div>
      <div className={s.list}>
        {rows.map((n, i) => {
          const un = isUnread(n, rd), who = av(n.u);
          return (
            <Clickable
              key={n.id}
              href={n.href}
              onOpen={() => markRead(n)}
              krow={i}
              className={cx('row-link', s.item, !un && s.read)}
              style={i === kIdx ? KEY_ROW : undefined}
            >
              <Person person={who} size={32} />
              <div className={s.body}>
                {/* Unread items are told apart by their darker text; this says so to screen readers */}
                <span className={s.headline}>
                  {un ? <span className="visually-hidden">Unread: </span> : null}
                  <strong className={s.actor}>{who.name}</strong> <span className={s.verb}>{n.verb}</span> <span className={s.itemId}>{n.itemId}</span>
                </span>
                <span className={cx('bui-trunc', s.title)}>{n.title}</span>
                {n.text ? <span className={s.excerpt}>{n.text}</span> : null}
              </div>
              <span className={s.time}><Icon name={n.icon} size={14} />{fAt(n.at)}</span>
            </Clickable>
          );
        })}
        {!fl.length ? <EmptyState art="mug" title="You're all caught up" text="Mentions, assignments and review decisions will show up here" /> : null}
      </div>
      <Pagination pg={pg} onPage={p => { setPage(p); setKIdx(-1); window.scrollTo(0, 0); }} />
    </div>
  );
}
