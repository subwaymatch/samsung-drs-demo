import { useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { DST, RESOLUTION, RESOLUTION_KEYS, RST, SEV, UM, USERS } from '@/lib/constants';
import { setDraft } from '@/lib/drafts';
import { fAt, fFull, nowStr } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av, engineerOptions, personOption } from '@/lib/people';
import { affOf, affToVals, modelInfo } from '@/lib/products';
import { A, autoSub, jobOf, lastAt } from '@/lib/records';
import { addAffected, affectedView, defectGraph, relatedView, removeAffected } from '@/lib/relations';
import { deleteDefect, setSubscribed, updDefect, updReview, useApp } from '@/lib/store';
import type { Defect, DefectStatus, Resolution, Severity } from '@/lib/types';
import { defectChangelists, defectRecords, defectTargets } from '@/lib/views';
import { Loading, Note, StatusLabel } from '../common/basics';
import { Clickable } from '../common/clickable';
import {
  ActivityFeed, AffectedProducts, Breadcrumb, Composer, ConfirmDelete, PersonCard, ProductPanel, RecordsAcrossSystems, RelatedSection, SideLabel, Subscribers
} from '../common/detail';
import { RelGraph } from '../graphs/rel-graph';
import { useShell } from '../shell/shell-context';
import { ActionGroup } from '../ui/action-group';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Input } from '../ui/fields';
import { Attachments } from '../ui/files';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Select } from '../ui/select';
import { sevOptions } from './defects-list';
import { NotFoundView } from './not-found-view';
import { langOf } from '@/lib/text';
import { cx } from '@/lib/cx';
import s from './defect-detail.module.css';

export function DefectDetail({ id }: { id: string }) {
  const app = useApp();
  const navigate = useNavigate();
  const { flash } = useShell();
  const [confirmDel, setConfirmDel] = useState(false);
  const [linkCl, setLinkCl] = useState(false);
  const [clInput, setClInput] = useState('');
  const [clErr, setClErr] = useState('');
  const [synced, setSynced] = useState('5 minutes ago');
  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';
  const d = data?.defects.find(x => x.id === id);

  const derived = useMemo(() => {
    if (!data || !d) return null;
    const linked = data.reviews.filter(r => r.linked === d.id);
    const cls = defectChangelists(d, linked);
    const rel = relatedView(d, data.defects, true);
    return { linked, cls, rel, graph: defectGraph(d, data.defects, rel, linked), aff: affectedView(d.model, affOf(d), '') };
  }, [data, d]);
  const people = useMemo(() => USERS.filter(u => u.id !== meId).map(u => personOption(u.id)), [meId]);
  const engItems = useMemo(() => engineerOptions(), []);

  if (!app) return <Loading />;
  if (!d || !derived || !prefs) return <NotFoundView text={`There is no defect ${id}. It may have been deleted.`} back={{ href: '/defects', label: 'Defects' }} />;

  const upd = (fn: (x: Defect) => Defect) => updDefect(d.id, fn);
  const log = (x: Defect, text: string): Defect => ({ ...x, activity: [...x.activity, A('e', meId, nowStr(), text)] });
  // Status moves along the workflow: start work, resolve with a resolution,
  // verify and close, or reopen. Reopening clears the resolution.
  const setStatus = (k: DefectStatus, res?: Resolution) => {
    if (d.status === k) return;
    const done = k === 'resolved' || k === 'closed';
    upd(x => {
      let next = log(x, 'changed status to ' + DST[k].l);
      if (res && res !== x.resolution) next = log(next, 'set resolution to ' + RESOLUTION[res]);
      return { ...next, status: k, resolution: done ? res || x.resolution || 'fixed' : undefined };
    });
    flash(`${d.id} set to ${DST[k].l}` + (res ? ', ' + RESOLUTION[res] : ''));
  };
  const isDone = d.status === 'resolved' || d.status === 'closed';
  const rec = defectRecords(d, derived.cls, synced);
  const tg = defectTargets(d);
  const sub = isSubscribed(prefs.subs, d, meId), auto = autoSub(d, meId);
  const subPeople = USERS.filter(u => isSubscribed(prefs.subs, d, u.id)).map(u => av(u.id));
  const reporter = av(d.reporter);
  const pm = modelInfo(d.model, d.fw);

  return (
    <div className={s.page}>
      <Breadcrumb href="/defects" label="Defects" id={d.id} />
      <div className={s.header}>
        <div className={s.headerMain}>
          <div className={s.badges}>
            <StatusLabel {...DST[d.status]} weight={600} />
            <span className={s.iconLabel}><Icon name={SEV[d.sev].icon} color={SEV[d.sev].c} size={16} />{SEV[d.sev].l}</span>
            <span title={rec.mig.d}><StatusLabel l={rec.mig.l} fg={rec.mig.fg} icon={rec.mig.icon} /></span>
          </div>
          <h1 lang={langOf(d.title)} className={s.title}>{d.title}</h1>
        </div>
        <div className={s.actions}>
          <Button
            variant={sub ? 'subOn' : 'ghost'}
            icon={sub ? 'bell-ring' : 'bell'}
            title={sub ? 'Click to stop notifications for this defect' : 'Get notified about comments, status changes and decisions'}
            onClick={() => { setSubscribed(d.id, meId, !sub); flash(sub ? 'Unsubscribed from ' + d.id : `Subscribed to ${d.id}, updates go to Notifications and your summary email`); }}
          >
            {sub ? 'Subscribed' : 'Subscribe'}
          </Button>
          <ActionGroup
            onPrimary={() => navigate(`/defects/${d.id}/edit`)}
            items={[
              d.status === 'closed'
                ? { icon: 'lock-open', label: 'Reopen', sub: 'Set status back to Open', onClick: () => { setStatus('open'); flash(d.id + ' reopened'); } }
                : d.status === 'resolved'
                  ? { icon: 'lock', label: 'Verify and close', sub: 'Confirm the resolution and close', onClick: () => { setStatus('closed'); flash(d.id + ' closed, ClearQuest record closed'); } }
                  : { icon: 'circle-check', label: 'Resolve as fixed', sub: 'Set status to Resolved', onClick: () => setStatus('resolved', 'fixed') },
              { icon: 'copy-plus', label: 'Clone with changes', sub: 'Open a new report prefilled from this one', onClick: () => { setDraft({ kind: 'defect', cloneOf: d.id, title: d.title, aff: affToVals(affOf(d)), model: d.model, comp: d.comp, sev: d.sev, status: 'open', fw: d.fw, desc: d.desc, steps: d.steps, assignees: [...d.assignees] }); navigate('/defects/new'); } },
              { icon: 'git-pull-request', label: 'Request code review', sub: 'Start a review linked to this defect', onClick: () => navigate('/reviews/new?defect=' + d.id) },
              { icon: 'link-2', label: 'Copy link', onClick: () => { navigator.clipboard?.writeText(location.origin + '/defects/' + d.id).catch(() => {}); flash('Link copied'); } },
              { sep: true },
              { icon: 'trash-2', label: 'Delete', danger: true, onClick: () => setConfirmDel(true) }
            ]}
          />
        </div>
      </div>

      <div className={s.overview}>
        <PersonCard label="Reported by" person={reporter} when={'Reported ' + fFull(d.created)} />
        <AffectedProducts
          {...derived.aff}
          onAdd={v => { const next = addAffected(affOf(d), v), msg = v.startsWith('line:') ? 'added product line ' + v.slice(5) : 'added ' + v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
          onRemove={c => { if (!c.remove) return; const next = removeAffected(affOf(d), c.remove), msg = c.remove.kind === 'line' ? 'removed product line ' + c.remove.v : 'removed ' + c.remove.v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
        />
      </div>
      <ProductPanel pm={pm} />
      {confirmDel ? (
        <ConfirmDelete id={d.id} noun="defect" onCancel={() => setConfirmDel(false)} onConfirm={() => { deleteDefect(d.id); flash(d.id + ' deleted'); navigate('/defects'); }} />
      ) : null}

      <div className={s.body}>
        <div className={s.main}>
          <section className={s.textSection}>
            <h2 className={s.textHeading}>Description</h2>
            <p lang={langOf(d.desc)} className={s.description}>{d.desc}</p>
          </section>
          {d.steps ? (
            <section className={s.textSection}>
              <h2 className={s.textHeading}>Steps to reproduce</h2>
              <p lang={langOf(d.steps)} className={s.steps}>{d.steps}</p>
            </section>
          ) : null}
          {d.attachments.length ? (
            <section className={s.attachments}>
              <h2 className={s.textHeading}>Attachments ({d.attachments.length})</h2>
              <Attachments items={d.attachments} />
            </section>
          ) : null}

          <RecordsAcrossSystems
            sub={rec.sub}
            legacy={rec.legacy}
            next={rec.next}
            synced={rec.synced}
            onSync={() => { setSynced('just now'); flash('Synced with ClearQuest, ClearCase, Jira, P4 and Confluence'); }}
            onOpen={x => flash(`Demo: this would open ${x.sys} ${x.id}`)}
          />

          <section className={s.mapSection}>
            <div className={s.heading}>
              <h2 className={s.sectionTitle}>Relationship map</h2>
              <span className={s.mapSub}>Related defects, code reviews and affected product lines. Click a card to open it; drag to pan.</span>
            </div>
            <div className={s.graph}>
              <RelGraph nodes={derived.graph.nodes} edges={derived.graph.edges} height={540} />
            </div>
            <div className={s.legend}>
              <span className={s.iconLabel}><span className={s.lineLinked} />Linked</span>
              <span className={s.iconLabel}><span className={s.lineSuggested} />Suggested or indirect</span>
            </div>
          </section>

          <RelatedSection
            title="Related defects"
            sub="Linked by your team, plus suggestions with the same model, component or a similar title"
            linkLabel="Link defect"
            {...derived.rel}
            emptyTitle="No related defects linked yet"
            emptyText="Link defects that share a root cause or symptom. Likely matches are suggested below."
            onLink={o => linkRelated(d.id, o, true, meId, flash)}
            onUnlink={o => linkRelated(d.id, o, false, meId, flash)}
          />

          <section className={s.section}>
            <div className={s.reviewsHead}>
              <h2 className={s.sectionTitle}>Linked code reviews</h2>
              <Button variant="ghost" size="sm" icon="git-pull-request" onClick={() => navigate('/reviews/new?defect=' + d.id)}>Request code review</Button>
            </div>
            <div className={s.list}>
              {derived.linked.map(r => (
                <Clickable key={r.id} href={'/reviews/' + r.id} className={cx('row-link', s.reviewRow)}>
                  <span className={s.reviewId}>{r.id}</span>
                  <span className={cx('bui-trunc', s.rowTitle)}>{r.title}</span>
                  <StatusLabel {...RST[r.status]} />
                </Clickable>
              ))}
            </div>
            {!derived.linked.length ? <Note icon="git-pull-request" title="No code review linked yet" text="Request a code review when a fix is ready. Its Helix Swarm status will show here." /> : null}
          </section>

          <section className={s.section}>
            <div className={s.changelistsHead}>
              <div className={s.heading}>
                <h2 className={s.p4Title}>
                  <img src="/logos/perforce.svg" alt="" className={s.p4Logo} />
                  Perforce changelists
                </h2>
                <span className={s.meta}>Fixes recorded on P4 job <span className={s.jobId}>{jobOf(d.id)}</span></span>
              </div>
              <Button variant="ghost" size="sm" icon="link" onClick={() => { setLinkCl(o => !o); setClInput(''); setClErr(''); }}>Link changelist</Button>
            </div>
            {linkCl ? (
              <>
                <div className={s.changelistForm}>
                  <div className={s.changelistField}><Input icon="git-commit" mono value={clInput} onChange={v => { setClInput(v); setClErr(''); }} placeholder="Changelist number, e.g. 1492310" ariaLabel="Changelist number" /></div>
                  <Button
                    variant="primary"
                    icon="check"
                    onClick={() => {
                      const cl = clInput.trim();
                      if (!/^\d{6,8}$/.test(cl)) return setClErr('Enter a changelist number with 6 to 8 digits.');
                      upd(x => ({ ...log(x, `linked changelist ${cl} to ${jobOf(x.id)} (p4 fix)`), p4: [...(x.p4 || []), { cl, u: meId, at: nowStr(), desc: 'Changelist ' + cl }] }));
                      setLinkCl(false);
                      setClInput('');
                      flash(`Changelist ${cl} fixes ${jobOf(d.id)}`);
                    }}
                  >
                    p4 fix
                  </Button>
                  <Button variant="secondary" onClick={() => setLinkCl(false)}>Cancel</Button>
                </div>
                {clErr ? <span className={s.error}>{clErr}</span> : null}
              </>
            ) : null}
            <div className={s.list}>
              {derived.cls.map(c => (
                <div key={c.cl} className={s.changelist}>
                  <span className={s.code}>{c.cl}</span>
                  <StatusLabel l={c.status} fg={c.fg} icon={c.icon} size={14} />
                  <div className={s.changelistText}><span className="bui-trunc">{c.desc}</span><span className={cx('bui-trunc', s.meta)}>{c.meta}</span></div>
                  <span className={s.changelistTime}>{c.at}</span>
                </div>
              ))}
            </div>
            {!derived.cls.length ? (
              isDone && d.resolution && d.resolution !== 'fixed'
                ? <Note icon="git-commit" title="No changelists linked" text={`Resolved as ${RESOLUTION[d.resolution].toLowerCase()}, so no code change was needed`} />
                : <Note icon="git-commit" title={isDone ? 'No changelists linked' : 'No changelists linked yet'} text={`Fixes appear here once they are recorded on ${jobOf(d.id)} with p4 fix`} />
            ) : null}
          </section>

          <section className={s.activity}>
            <h2 className={s.sectionTitle}>Activity</h2>
            <ActivityFeed items={d.activity} />
            <Composer me={av(meId)} people={people} onPost={(t, att) => upd(x => ({ ...x, activity: [...x.activity, A('c', meId, nowStr(), t, null, att)] }))} />
          </section>
        </div>

        <aside className={s.aside}>
          <div className={s.targets}>
            <SideLabel icon="gauge">{tg.title}</SideLabel>
            <div className={s.target}>
              <span className={s.meta}>First response within {tg.rl}</span>
              <StatusLabel l={tg.r.text} fg={tg.r.fg} icon={tg.r.icon} weight={600} />
            </div>
            <div className={s.target}>
              <span className={s.meta}>Resolution within {tg.fl}</span>
              <StatusLabel l={tg.f.text} fg={tg.f.fg} icon={tg.f.icon} weight={600} />
              {tg.f.sub ? <span className={s.meta}>{tg.f.sub}</span> : null}
            </div>
          </div>
          <div className={s.section}>
            <SideLabel icon="circle-dot">Status</SideLabel>
            <div className={s.statusLine}>
              <StatusLabel {...DST[d.status]} weight={600} />
              {isDone && d.resolution ? <span className={s.meta}>{RESOLUTION[d.resolution]}</span> : null}
            </div>
            <div className={s.statusActions}>
              {d.status === 'open' ? <Button variant="secondary" size="sm" icon="circle-dot" onClick={() => setStatus('in_progress')}>Start work</Button> : null}
              {d.status === 'in_progress' ? <Button variant="secondary" size="sm" icon="circle" onClick={() => setStatus('open')}>Stop work</Button> : null}
              {d.status === 'resolved' ? <Button variant="secondary" size="sm" icon="lock" onClick={() => setStatus('closed')}>Verify and close</Button> : null}
              {isDone ? <Button variant="secondary" size="sm" icon="rotate-ccw" onClick={() => setStatus('open')}>Reopen</Button> : null}
            </div>
            {!isDone ? (
              <Select ariaLabel="Resolve as" placeholder="Resolve as..." value={null} items={RESOLUTION_KEYS.map(k => ({ value: k, label: RESOLUTION[k], icon: 'circle-check', color: DST.resolved.fg }))} onValueChange={v => setStatus('resolved', v as Resolution)} />
            ) : null}
          </div>
          <div className={s.severity}>
            <SideLabel icon="flag">Severity</SideLabel>
            <Select ariaLabel="Severity" items={sevOptions()} value={d.sev} onValueChange={v => { if (v !== d.sev) upd(x => ({ ...log(x, 'changed severity to ' + SEV[v as Severity].l), sev: v as Severity })); }} />
          </div>
          <div className={s.assignees}>
            <SideLabel icon="users">Assignees</SideLabel>
            {d.assignees.map(u => {
              const p = av(u);
              return (
                <div key={u} className={s.assignee}>
                  <Person person={p} size={32} />
                  <div className={s.assigneeText}><span className={s.assigneeName}>{p.name}</span><span className={s.meta}>{p.title}</span></div>
                  <Button variant="ghost" size="sm" icon="x" iconOnly title="Remove assignee" onClick={() => upd(x => ({ ...log(x, 'unassigned ' + UM[u].name), assignees: x.assignees.filter(y => y !== u) }))} />
                </div>
              );
            })}
            {!d.assignees.length ? (
              <div className={s.unassigned}>
                <span className={s.unassignedIcon}><Icon name="user-plus" size={16} color="oklch(0.5 0.17 293)" /></span>
                <span className={s.unassignedText}>No one assigned yet</span>
              </div>
            ) : null}
            <Combobox
              items={engItems.filter(i => !d.assignees.includes(i.value))}
              value={null}
              onValueChange={v => { if (v && !d.assignees.includes(v)) upd(x => ({ ...log(x, 'assigned ' + UM[v].name), assignees: [...x.assignees, v] })); }}
              placeholder="Add assignee"
              leadIcon="user-plus"
              dashed
              resetOnSelect
            />
          </div>
          <div className={s.facts}>
            <span className={s.factLabel}>Model</span><span className={s.model}>{d.model}</span>
            <span className={s.factLabel}>Component</span><span>{d.comp}</span>
            <span className={s.factLabel}>Firmware</span><span className={s.code}>{d.fw}</span>
            <span className={s.factLabel}>Reporter</span><span>{reporter.name}</span>
            <span className={s.factLabel}>Created</span><span>{fFull(d.created)}</span>
            <span className={s.factLabel}>Updated</span><span>{fAt(lastAt(d))}</span>
          </div>
          <Subscribers
            people={subPeople}
            count={subPeople.length + (subPeople.length === 1 ? ' person' : ' people')}
            note={sub ? (auto ? 'You are subscribed because you are ' + (d.reporter === meId ? 'the reporter' : 'an assignee') + '.' : 'You get notified about every update') : 'Subscribe to get notified about every update'}
          />
        </aside>
      </div>
    </div>
  );
}

/** Link or unlink two items as related, on both sides. */
export function linkRelated(a: string, b: string, on: boolean, meId: string, flash: (m: string) => void, kind: 'd' | 'r' = 'd') {
  const noun = kind === 'd' ? 'defect' : 'code review';
  const fn = <T extends { related?: string[]; activity: Defect['activity'] }>(x: T, other: string): T => {
    const rel = x.related || [], has = rel.includes(other);
    if (on === has) return x;
    return { ...x, related: on ? [...rel, other] : rel.filter(i => i !== other), activity: [...x.activity, A('e', meId, nowStr(), (on ? 'linked related ' : 'unlinked related ') + noun + ' ' + other)] };
  };
  if (kind === 'd') {
    updDefect(a, x => fn(x, b));
    updDefect(b, x => fn(x, a));
  } else {
    updReview(a, x => fn(x, b));
    updReview(b, x => fn(x, a));
  }
  flash(on ? `${b} linked as related` : `${b} unlinked`);
}
