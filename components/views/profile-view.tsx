import { Link } from 'react-router';
import { useMemo } from 'react';
import { DEC, DST, MUTED, ROLE, RST, SEV, TM, TYPE_ICON, UM } from '@/lib/constants';
import { fAt } from '@/lib/dates';
import { isActiveReview, isOpen } from '@/lib/records';
import { useApp } from '@/lib/store';
import { cx } from '@/lib/cx';
import { Loading, Note, PhotoPlaceholder, StatusLabel } from '../common/basics';
import { Clickable } from '../common/clickable';
import { Icon } from '../ui/icon';
import { NotFoundView } from './not-found-view';
import { langOf } from '@/lib/text';
import s from './profile-view.module.css';

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
  if (!u || !v) return <NotFoundView text="This person is not in the directory" back={{ href: '/teams', label: 'Teams' }} />;
  const stats = [
    u.role === 'qa' ? { l: 'Defects reported', n: v.counts.reported } : null,
    u.role === 'eng' ? { l: 'Defects assigned', n: v.counts.assigned } : null,
    u.role !== 'cr' ? { l: 'Reviews requested', n: v.counts.authored } : null,
    u.role === 'cr' ? { l: 'Reviews decided', n: v.counts.reviewed } : null
  ].filter((x): x is { l: string; n: number } => !!x);

  return (
    <div className={s.page}>
      <div className={s.crumbs}>
        <Link to="/teams" className="bui-btn bui-link"><Icon name="arrow-left" size={16} />Teams</Link><span>/</span><span>{u.name}</span>
      </div>
      <div className={s.hero}>
        <PhotoPlaceholder w={160} h={200} iconSize={48} src={u.photo} title={u.photo ? u.name : 'Photo placeholder'} />
        <div className={s.info}>
          <div className={s.names}>
            <h1 lang={langOf(u.name)} className={s.name}>{u.name}</h1>
            {u.en !== u.name ? <span className={s.meta}>{u.en}</span> : null}
          </div>
          <span className={s.jobTitle}>{u.title}</span>
          <span className={s.meta}>{TM[u.team].name}, {ROLE[u.role]}, {u.site}</span>
          <a href={'mailto:' + u.email} className={s.email}><Icon name="mail" size={15} />{u.email}</a>
          <p className={s.intro}>{u.intro}</p>
          {stats.length ? (
            <div className={s.stats}>
              {stats.map(st => (
                <div key={st.l} className={s.stat}>
                  <span className={s.statLabel}>{st.l}</span>
                  <span className={s.statValue}>{st.n}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={s.lists}>
        <section className={s.list}>
          <h2 className={s.listTitle}>Open defects assigned ({v.openD.length})</h2>
          {v.openD.slice(0, 8).map(x => (
            <Clickable key={x.id} href={'/defects/' + x.id} className={cx('row-link', s.row)}>
              <Icon name={SEV[x.sev].icon} size={16} color={SEV[x.sev].c} />
              <span className={s.rowId}>{x.id}</span>
              <div className={s.rowText}><span className={cx('bui-trunc', s.rowTitle)}>{x.title}</span><span className={cx('bui-trunc', s.rowMeta)}>{x.model}, {x.comp}</span></div>
              <StatusLabel {...DST[x.status]} size={14} />
            </Clickable>
          ))}
          {!v.openD.length ? <span className={s.empty}>No open defects assigned</span> : null}
        </section>
        <section className={s.list}>
          <h2 className={s.listTitle}>Active code reviews ({v.revs.length})</h2>
          {v.revs.slice(0, 8).map(x => (
            <Clickable key={x.id} href={'/reviews/' + x.id} className={cx('row-link', s.row)}>
              <Icon name={TYPE_ICON[x.type]} size={16} color={MUTED} />
              <span className={s.rowId}>{x.id}</span>
              <div className={s.rowText}><span className={cx('bui-trunc', s.rowTitle)}>{x.title}</span><span className={cx('bui-trunc', s.rowMeta)}>{(x.author === id ? 'Author' : 'Reviewer') + ', ' + x.type}</span></div>
              <StatusLabel {...RST[x.status]} size={14} />
            </Clickable>
          ))}
          {!v.revs.length ? <span className={s.empty}>No active code reviews</span> : null}
        </section>
      </div>
      <section className={s.activity}>
        <h2 className={s.listTitle}>Recent activity</h2>
        {v.acts.map(({ x, o, p }, i) => (
          <Clickable key={o.id + i} href={p + o.id} className={cx('row-link', s.activityRow)}>
            <span className={s.rowId}>{o.id}</span>
            <div className={s.rowText}>
              <span className="bui-trunc">{x.t === 'e' ? x.x.charAt(0).toUpperCase() + x.x.slice(1) : x.t === 'd' && x.dec ? DEC[x.dec] : 'Commented' + (x.loc ? ' on ' + x.loc : '')}</span>
              <span className={cx('bui-trunc', s.rowMeta)}>{o.title}</span>
            </div>
            <span className={s.activityTime}>{fAt(x.at)}</span>
          </Clickable>
        ))}
        {!v.acts.length ? <Note className={s.activityNote} icon="clock" title="No activity yet" text="Defects, code reviews and comments from this person will show here" /> : null}
      </section>
    </div>
  );
}
