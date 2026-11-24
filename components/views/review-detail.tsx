import { Link, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { MUTED, RST, TYPE_ICON, UM, USERS } from '@/lib/constants';
import { setDraft } from '@/lib/drafts';
import { fAt, fFull, nowStr } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av, personOption, reviewerOptions } from '@/lib/people';
import { A, autoSub, computeStatus, lastAt, p4Of } from '@/lib/records';
import { addAffected, affectedView, relatedView, removeAffected } from '@/lib/relations';
import { genFiles } from '@/lib/seed/generate';
import { deleteReview, setPrefs, setSubscribed, updReview, useApp } from '@/lib/store';
import type { Decision, Review } from '@/lib/types';
import { decLabel, reviewBanner, reviewRecords, reviewTurnaround } from '@/lib/views';
import { Loading, Note, StatusLabel } from '../common/basics';
import { ActivityFeed, AffectedProducts, Breadcrumb, Composer, ConfirmDelete, PersonCard, ProductPanel, RecordsAcrossSystems, RelatedSection, SideLabel, Subscribers } from '../common/detail';
import { DIFF_MODES, DiffFile } from '../common/diff';
import { useShell } from '../shell/shell-context';
import { ActionGroup } from '../ui/action-group';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { Input, Textarea } from '../ui/fields';
import { Attachments } from '../ui/files';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { Segmented } from '../ui/toggles';
import { linkRelated } from './defect-detail';
import { NotFoundView } from './not-found-view';
import { langOf } from '@/lib/text';
import s from './review-detail.module.css';

export function ReviewDetail({ id }: { id: string }) {
  const app = useApp();
  const navigate = useNavigate();
  const { flash } = useShell();
  const [confirmDel, setConfirmDel] = useState(false);
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState('');
  const [wd, setWd] = useState<{ open: boolean; reason: string; err: string }>({ open: false, reason: '', err: '' });
  const [synced, setSynced] = useState({ all: '5 minutes ago', swarm: '2 minutes ago' });
  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';
  const r = data?.reviews.find(x => x.id === id);

  const derived = useMemo(() => {
    if (!data || !r) return null;
    const rec = reviewRecords(r, data.defects, synced.swarm, synced.all);
    return { rec, rel: relatedView(r, data.reviews, false), aff: affectedView(rec.pm.has ? rec.pm.id : null, rec.affects, rec.inheritedFrom) };
  }, [data, r, synced]);
  const people = useMemo(() => USERS.filter(u => u.id !== meId).map(u => personOption(u.id)), [meId]);

  if (!app) return <Loading />;
  if (!r || !derived || !prefs || !data) return <NotFoundView text={`There is no code review ${id}. It may have been deleted.`} back={{ href: '/reviews', label: 'Code Reviews' }} />;

  const me = UM[meId], isCR = me.role === 'cr', isAuthor = r.author === meId;
  const myRv = r.reviewers.find(v => v.u === meId);
  const final = r.status === 'approved' || r.status === 'denied' || r.status === 'withdrawn';
  const nRv = r.reviewers.length, nAp = r.reviewers.filter(v => v.dec === 'approved').length;
  const st = RST[r.status], rec = derived.rec, sw = rec.swarm;
  const banner = reviewBanner(r), tat = reviewTurnaround(r);
  const sub = isSubscribed(prefs.subs, r, meId), auto = autoSub(r, meId);
  const subPeople = USERS.filter(u => isSubscribed(prefs.subs, r, u.id)).map(u => av(u.id));
  const addable = reviewerOptions().filter(i => !r.reviewers.some(v => v.u === i.value));
  const upd = (fn: (x: Review) => Review) => updReview(r.id, fn);
  const log = (x: Review, text: string): Review => ({ ...x, activity: [...x.activity, A('e', meId, nowStr(), text)] });
  const mode = prefs.diff;

  const addReviewer = (u: string) => {
    upd(x => {
      if (x.reviewers.some(v => v.u === u)) return x;
      const rv = [...x.reviewers, { u, dec: null }];
      return { ...log(x, `assigned ${UM[u].name} as reviewer`), reviewers: rv, status: x.status === 'withdrawn' ? x.status : computeStatus(rv) };
    });
    flash(UM[u].name + ' added as reviewer');
  };
  const decide = (dec: Decision) => {
    const t = note.trim();
    if (dec !== 'approved' && !t) return setNoteErr(dec === 'changes' ? 'Describe what needs to change.' : 'Give a reason for denying this change.');
    let ns = r.status;
    upd(x => {
      const rv = x.reviewers.map(v => (v.u === meId ? { ...v, dec } : v));
      ns = computeStatus(rv);
      return { ...x, reviewers: rv, status: ns, activity: [...x.activity, A('d', meId, nowStr(), t || 'Approved for submit.', dec)] };
    });
    setNote('');
    setNoteErr('');
    flash(dec === 'approved' ? (ns === 'approved' ? 'Approved by all reviewers, vote synced to Swarm' : 'Approval recorded, waiting on other reviewers') : dec === 'changes' ? 'Modification requested, vote synced to Swarm' : 'Change denied, Swarm review rejected');
  };
  const ld = r.linked ? data.defects.find(x => x.id === r.linked) : undefined;
  const fetchSwarm = () => {
    const empty = !r.files.length;
    if (empty) upd(x => { const files = genFiles(x, ld ? ld.comp : null); return { ...log(x, `fetched ${files.length} shelved files from Helix Swarm`), files }; });
    setSynced(x => ({ ...x, swarm: 'just now' }));
    flash(empty ? 'Fetched shelved files from Helix Swarm' : 'Synced with Helix Swarm');
  };
  const add = r.files.reduce((a, f) => a + f.add, 0), del = r.files.reduce((a, f) => a + f.del, 0);

  return (
    <div className={s.page}>
      <Breadcrumb href="/reviews" label="Code Reviews" id={r.id} />
      <div className={s.header}>
        <div className={s.headerMain}>
          <div className={s.badges}>
            <StatusLabel {...st} weight={600} />
            <span className={s.type}><Icon name={TYPE_ICON[r.type]} color="var(--color-muted)" size={16} />{r.type}</span>
            <span title={rec.mig.d}><StatusLabel l={rec.mig.l} fg={rec.mig.fg} icon={rec.mig.icon} /></span>
          </div>
          <h1 lang={langOf(r.title)} className={s.title}>{r.title}</h1>
        </div>
        <div className={s.actions}>
          <Button
            variant={sub ? 'subOn' : 'ghost'}
            icon={sub ? 'bell-ring' : 'bell'}
            title={sub ? 'Click to stop notifications for this review' : 'Get notified about comments, status changes and decisions'}
            onClick={() => { setSubscribed(r.id, meId, !sub); flash(sub ? 'Unsubscribed from ' + r.id : `Subscribed to ${r.id}, updates go to Notifications and your summary email`); }}
          >
            {sub ? 'Subscribed' : 'Subscribe'}
          </Button>
          {isAuthor || isCR ? (
            <ActionGroup
              onPrimary={() => navigate(`/reviews/${r.id}/edit`)}
              items={[
                r.status === 'denied' || r.status === 'withdrawn'
                  ? { icon: 'lock', label: 'Withdraw request', sub: r.status === 'withdrawn' ? 'Already withdrawn' : 'Already denied', disabled: true }
                  : { icon: 'archive', label: 'Withdraw request', sub: 'Close without submitting, whatever the review result', onClick: () => setWd({ open: true, reason: '', err: '' }) },
                { icon: 'copy-plus', label: 'Clone with changes', sub: 'Open a new request prefilled from this one', onClick: () => { setDraft({ kind: 'review', cloneOf: r.id, title: r.title, type: r.type, branch: r.branch, linked: r.linked || null, desc: r.desc }); navigate('/reviews/new'); } },
                { icon: 'link-2', label: 'Copy link', onClick: () => { navigator.clipboard?.writeText(location.origin + '/reviews/' + r.id).catch(() => {}); flash('Link copied'); } },
                { sep: true },
                { icon: 'trash-2', label: 'Delete', danger: true, onClick: () => setConfirmDel(true) }
              ]}
            />
          ) : null}
        </div>
      </div>

      <div className={s.overview}>
        <PersonCard label="Requested by" person={av(r.author)} when={'Requested ' + fFull(r.submitted)} />
        <AffectedProducts
          {...derived.aff}
          onAdd={v => { const next = addAffected(rec.affects, v), msg = v.startsWith('line:') ? 'added product line ' + v.slice(5) : 'added ' + v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
          onRemove={c => { if (!c.remove) return; const next = removeAffected(rec.affects, c.remove), msg = c.remove.kind === 'line' ? 'removed product line ' + c.remove.v : 'removed ' + c.remove.v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
        />
      </div>
      <ProductPanel pm={rec.pm} />
      {confirmDel ? <ConfirmDelete id={r.id} noun="review" onCancel={() => setConfirmDel(false)} onConfirm={() => { deleteReview(r.id); flash(r.id + ' deleted'); navigate('/reviews'); }} /> : null}

      {r.status === 'pending' && isCR ? (
        <div className={s.assignBanner}>
          <div className={s.assignText}>
            <span className={s.assignTitle}><Icon name="user-plus" size={16} />This change needs reviewers</span>
            <span className={s.bannerNote}>Assign one or more reviewers from the code review team. Every assigned reviewer must approve before the change is submitted.</span>
          </div>
          <div className={s.reviewerPicker}><Combobox items={addable} value={null} onValueChange={v => v && addReviewer(v)} placeholder="Add reviewer" leadIcon="user-plus" resetOnSelect /></div>
        </div>
      ) : null}
      {r.status === 'pending' && !isCR ? (
        <div className={s.waiting}>
          <Icon name="clock" size={16} style={{ marginTop: 3 }} />
          <span>Waiting for the code review team to assign reviewers. Switch to a code review team member in <Link to="/settings">Settings</Link> to assign one.</span>
        </div>
      ) : null}
      {myRv && !myRv.dec && (r.status === 'in_review' || r.status === 'changes') ? (
        <div className={s.decision}>
          <div className={s.heading}>
            <span className={s.decisionTitle}>Review decision</span>
            <span className={s.bannerNote}>
              {nRv > 1
                ? `You are one of ${nRv} reviewers; ${nAp} of ${nRv} have approved. Every reviewer must approve before submit. A note is required to request modification or deny.`
                : 'You are the assigned reviewer. A note is required to request modification or deny.'}
            </span>
          </div>
          <Textarea value={note} onChange={v => { setNote(v); setNoteErr(''); }} rows={3} placeholder="Review note" ariaLabel="Review note" />
          {noteErr ? <span className={s.error} role="alert">{noteErr}</span> : null}
          <div className={s.buttons}>
            <Button variant="primary" icon="check" onClick={() => decide('approved')}>Approve</Button>
            <Button variant="secondary" icon="rotate-ccw" onClick={() => decide('changes')}>Request modification</Button>
            <Button variant="ghost" icon="ban" onClick={() => decide('denied')}>Deny</Button>
          </div>
        </div>
      ) : null}
      {wd.open ? (
        <div className={s.withdraw}>
          <div className={s.heading}>
            <span className={s.withdrawTitle}>Withdraw this request</span>
            <span className={s.sub}>Use this when plans change and the code won't be submitted, whatever the review result. It's counted as Withdrawn in Review outcomes.</span>
          </div>
          <Input value={wd.reason} onChange={v => setWd(w => ({ ...w, reason: v, err: '' }))} placeholder="Reason, e.g. feature dropped from the 2018 release" ariaLabel="Reason" />
          {wd.err ? <span className={s.error} role="alert">{wd.err}</span> : null}
          <div className={s.buttons}>
            <Button
              variant="primary"
              icon="archive"
              onClick={() => {
                const t = wd.reason.trim();
                if (!t) return setWd(w => ({ ...w, err: 'Add a short reason so reviewers know why.' }));
                const at = nowStr();
                upd(x => ({ ...log(x, 'withdrew the request: ' + t), status: 'withdrawn', withdrawn: { at, by: meId, reason: t } }));
                setWd({ open: false, reason: '', err: '' });
                flash(r.id + ' withdrawn');
              }}
            >
              Withdraw request
            </Button>
            <Button variant="secondary" onClick={() => setWd({ open: false, reason: '', err: '' })}>Cancel</Button>
          </div>
        </div>
      ) : null}
      {banner.title ? (
        <div className={s.statusBanner} style={{ borderLeftColor: banner.fg }}>
          <div className={s.statusText}>
            <span className={s.statusTitle} style={{ color: banner.fg }}><Icon name={banner.icon} size={16} />{banner.title}</span>
            <span className={s.statusNote}>{banner.text}</span>
          </div>
          {r.status === 'changes' && isAuthor ? (
            <Button
              variant="primary"
              icon="refresh-cw"
              onClick={() => {
                upd(x => { const rv = x.reviewers.map(v => (v.dec === 'changes' ? { ...v, dec: null } : v)); return { ...log(x, 'resubmitted for review'), reviewers: rv, status: computeStatus(rv) }; });
                flash('Resubmitted, shelved files updated in Swarm');
              }}
            >
              Resubmit for review
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className={s.body}>
        <div className={s.main}>
          <section className={s.textSection}>
            <h2 className={s.textHeading}>Summary of change</h2>
            <p lang={langOf(r.desc)} className={s.description}>{r.desc}</p>
          </section>
          {r.attachments.length ? (
            <section className={s.attachments}>
              <h2 className={s.textHeading}>Attachments ({r.attachments.length})</h2>
              <Attachments items={r.attachments} />
            </section>
          ) : null}
          <RecordsAcrossSystems
            sub={rec.sub}
            legacy={rec.legacy}
            next={rec.next}
            synced={rec.synced}
            onSync={() => { setSynced(x => ({ ...x, all: 'just now' })); flash('Synced with ClearQuest, ClearCase, Review Board, Swarm, Jira and Confluence'); }}
            onOpen={x => flash(`Demo: this would open ${x.sys} ${x.id}`)}
          />
          <RelatedSection
            title="Related code reviews"
            sub="Linked by your team, plus suggestions that share a defect, branch or changed files"
            linkLabel="Link review"
            {...derived.rel}
            emptyTitle="No related code reviews linked yet"
            emptyText="Link reviews that touch the same code or fix the same defect. Likely matches are suggested below."
            onLink={o => linkRelated(r.id, o, true, meId, flash, 'r')}
            onUnlink={o => linkRelated(r.id, o, false, meId, flash, 'r')}
          />
          <section className={s.files}>
            <div className={s.filesHead}>
              <div className={s.heading}>
                <h2 className={s.sectionTitle}>Changed files</h2>
                <span className={s.meta}>{r.files.length ? `${r.files.length} file${r.files.length > 1 ? 's' : ''}, +${add} -${del}, Click a line to comment` : 'Not synced from Helix Swarm yet'}</span>
              </div>
              {r.files.length ? <div className={s.diffMode}><Segmented ariaLabel="Diff layout" items={DIFF_MODES} value={mode} onValueChange={v => setPrefs({ diff: v as 'sbs' | 'uni' })} /></div> : null}
            </div>
            {r.files.map((f, fi) => (
              <DiffFile
                key={f.path + fi}
                f={f}
                fi={fi}
                mode={mode}
                comments={r.lineComments || []}
                people={people}
                onComment={(fIdx, key, no, text) => {
                  const at = nowStr(), path = r.files[fIdx].path;
                  upd(x => ({ ...x, lineComments: [...(x.lineComments || []), { f: fIdx, key, no, u: meId, at, x: text }], activity: [...x.activity, A('c', meId, at, text, null, [], path + ':' + no)] }));
                  flash('Line comment added, synced to Swarm');
                }}
              />
            ))}
            {!r.files.length ? (
              <div className={s.fetch}>
                <span className={s.fetchIcon}><Icon name="archive" size={20} color="oklch(0.5 0.17 293)" /></span>
                <div className={s.fetchMain}>
                  <div className={s.fetchText}>
                    <span className={s.fetchTitle}>Files haven't been fetched from Helix Swarm yet</span>
                    <span className={s.fetchNote}>New requests only store the shelved changelist number. The changed files are loaded from Swarm review {sw.id} (shelved CL {sw.shelved}) on the next sync.</span>
                  </div>
                  <div className={s.buttons}>
                    <Button variant="primary" icon="refresh-cw" onClick={fetchSwarm}>Fetch from Swarm</Button>
                    <Button variant="secondary" icon="external-link" onClick={() => flash(`Demo: this would open Helix Swarm review ${p4Of(r).swId}`)}>Open in Swarm</Button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          <section className={s.activity}>
            <h2 className={s.sectionTitle}>Activity</h2>
            <ActivityFeed items={r.activity} />
            <Composer me={av(meId)} people={people} onPost={(t, att) => upd(x => ({ ...x, activity: [...x.activity, A('c', meId, nowStr(), t, null, att)] }))} />
          </section>
        </div>

        <aside className={s.aside}>
          <div className={s.turnaround}>
            <SideLabel icon="clock">Review turnaround</SideLabel>
            <span className={s.turnaroundValue} style={{ color: tat.color }}>{tat.text}</span>
            <span className={s.turnaroundNote}>{tat.note}</span>
          </div>
          <Subscribers
            people={subPeople}
            count={subPeople.length + (subPeople.length === 1 ? ' person' : ' people')}
            note={sub ? (auto ? 'You are subscribed because you are ' + (isAuthor ? 'the author' : 'a reviewer') + '.' : 'You get notified about every update') : 'Subscribe to get notified about every update'}
          />
          <div className={s.people}>
            <div className={s.author}>
              <SideLabel icon="user">Author</SideLabel>
              <span className={s.person}>
                <Person person={av(r.author)} size={32} />
                <span className={s.authorText}><span className={s.personName}>{UM[r.author].name}</span><span className={s.meta}>{UM[r.author].title}</span></span>
              </span>
            </div>
            <div className={s.reviewers}>
              <SideLabel icon="user-check" right={nRv ? `${nAp} of ${nRv} approved` : ''}>Reviewers</SideLabel>
              {r.reviewers.map(v => {
                const s2 = v.dec ? RST[v.dec] : { fg: MUTED, icon: 'clock' };
                return (
                  <div key={v.u} className={s.person}>
                    <Person person={av(v.u)} size={32} />
                    <div className={s.reviewerText}>
                      <span className={s.personName}>{UM[v.u].name}</span>
                      <span className={s.reviewerDecision} style={{ color: s2.fg }}><Icon name={s2.icon} size={14} />{decLabel(v.dec)}</span>
                    </div>
                    {isCR && !v.dec && !final ? (
                      <Button variant="ghost" size="sm" icon="x" iconOnly title="Remove reviewer" onClick={() => upd(x => { const rv = x.reviewers.filter(y => y.u !== v.u); return { ...log(x, `removed ${UM[v.u].name} as reviewer`), reviewers: rv, status: computeStatus(rv) }; })} />
                    ) : null}
                  </div>
                );
              })}
              {!nRv ? <span className={s.none}>Not assigned yet</span> : null}
              {isCR && !final && r.status !== 'pending' && addable.length ? (
                <Combobox items={addable} value={null} onValueChange={v => v && addReviewer(v)} placeholder="Add reviewer" leadIcon="user-plus" dashed resetOnSelect />
              ) : null}
            </div>
          </div>
          <div className={s.facts}>
            <span className={s.factLabel}>Stream</span><span className={s.stream}>{'//depot/printing/' + r.branch}</span>
            <span className={s.factLabel}>Defect</span>
            <span>{r.linked ? <Link to={'/defects/' + r.linked}>{r.linked}</Link> : <span className={s.none}>None</span>}</span>
            <span className={s.factLabel}>Submitted</span><span>{fFull(r.submitted)}</span>
            <span className={s.factLabel}>Updated</span><span>{fAt(lastAt(r))}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
