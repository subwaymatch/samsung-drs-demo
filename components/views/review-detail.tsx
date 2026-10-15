'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
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

export function ReviewDetail({ id }: { id: string }) {
  const app = useApp();
  const router = useRouter();
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
  if (!r || !derived || !prefs || !data) return <NotFoundView />;

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
    flash(dec === 'approved' ? (ns === 'approved' ? 'Approved by all reviewers · vote synced to Swarm' : 'Approval recorded · waiting on other reviewers') : dec === 'changes' ? 'Modification requested · vote synced to Swarm' : 'Change denied · Swarm review rejected');
  };
  const ld = r.linked ? data.defects.find(x => x.id === r.linked) : undefined;
  const fetchSwarm = () => {
    const empty = !r.files.length;
    if (empty) upd(x => { const files = genFiles(x, ld ? ld.comp : null); return { ...log(x, `fetched ${files.length} shelved files from Helix Swarm`), files }; });
    setSynced(s => ({ ...s, swarm: 'just now' }));
    flash(empty ? 'Fetched shelved files from Helix Swarm' : 'Synced with Helix Swarm');
  };
  const add = r.files.reduce((a, f) => a + f.add, 0), del = r.files.reduce((a, f) => a + f.del, 0);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <Breadcrumb href="/reviews" label="Code reviews" id={r.id} />
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <StatusLabel {...st} weight={600} />
            <span className="flex items-center gap-2"><Icon name={TYPE_ICON[r.type]} color="var(--color-muted)" size={16} />{r.type}</span>
            <span title={rec.mig.d}><StatusLabel l={rec.mig.l} fg={rec.mig.fg} icon={rec.mig.icon} /></span>
          </div>
          <h1 className="text-2xl leading-[1.4] font-bold tracking-[-0.02em] text-pretty">{r.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={sub ? 'subOn' : 'secondary'}
            icon={sub ? 'bell-ring' : 'bell'}
            title={sub ? 'Click to stop notifications for this review' : 'Get notified about comments, status changes and decisions'}
            onClick={() => { setSubscribed(r.id, meId, !sub); flash(sub ? 'Unsubscribed from ' + r.id : `Subscribed to ${r.id} · updates go to Notifications and your summary email`); }}
          >
            {sub ? 'Subscribed' : 'Subscribe'}
          </Button>
          {isAuthor || isCR ? (
            <ActionGroup
              onPrimary={() => router.push(`/reviews/${r.id}/edit`)}
              items={[
                r.status === 'denied' || r.status === 'withdrawn'
                  ? { icon: 'lock', label: 'Withdraw request', sub: r.status === 'withdrawn' ? 'Already withdrawn' : 'Already denied', disabled: true }
                  : { icon: 'archive', label: 'Withdraw request', sub: 'Close without submitting, whatever the review result', onClick: () => setWd({ open: true, reason: '', err: '' }) },
                { icon: 'copy-plus', label: 'Clone with changes', sub: 'Open a new request prefilled from this one', onClick: () => { setDraft({ kind: 'review', cloneOf: r.id, title: r.title, type: r.type, branch: r.branch, linked: r.linked || null, desc: r.desc }); router.push('/reviews/new'); } },
                { icon: 'link-2', label: 'Copy link', onClick: () => { navigator.clipboard?.writeText(location.origin + '/reviews/' + r.id).catch(() => {}); flash('Link copied'); } },
                { sep: true },
                { icon: 'trash-2', label: 'Delete', danger: true, onClick: () => setConfirmDel(true) }
              ]}
            />
          ) : null}
        </div>
      </div>

      <div className="grid items-start gap-x-14 gap-y-7 border-t border-line pt-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]">
        <PersonCard label="Requested by" person={av(r.author)} when={'Requested ' + fFull(r.submitted)} />
        <AffectedProducts
          {...derived.aff}
          onAdd={v => { const next = addAffected(rec.affects, v), msg = v.startsWith('line:') ? 'added product line ' + v.slice(5) : 'added ' + v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
          onRemove={c => { if (!c.remove) return; const next = removeAffected(rec.affects, c.remove), msg = c.remove.kind === 'line' ? 'removed product line ' + c.remove.v : 'removed ' + c.remove.v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
        />
      </div>
      <ProductPanel pm={rec.pm} />
      {confirmDel ? <ConfirmDelete id={r.id} noun="review" onCancel={() => setConfirmDel(false)} onConfirm={() => { deleteReview(r.id); flash(r.id + ' deleted'); router.push('/reviews'); }} /> : null}

      {r.status === 'pending' && isCR ? (
        <div className="flex flex-wrap items-center gap-5 border-l-[3px] border-accent-bar py-2 pl-[18px]">
          <div className="flex flex-[1_1_300px] flex-col gap-1">
            <span className="flex items-center gap-2 font-[650] text-accent-ink"><Icon name="user-plus" size={16} />This change needs reviewers</span>
            <span className="text-ink-5">Assign one or more reviewers from the code review team. Every assigned reviewer must approve before the change is submitted.</span>
          </div>
          <div className="w-[260px] max-w-full"><Combobox items={addable} value={null} onValueChange={v => v && addReviewer(v)} placeholder="Add reviewer" leadIcon="user-plus" resetOnSelect /></div>
        </div>
      ) : null}
      {r.status === 'pending' && !isCR ? (
        <div className="flex items-start gap-2 border-l-[3px] border-[oklch(0.88_0.01_290)] py-2 pl-[18px] text-ink-5">
          <Icon name="clock" size={16} style={{ marginTop: 3 }} />
          <span>Waiting for the code review team to assign reviewers. Switch to a code review team member in <NextLink href="/settings">Settings</NextLink> to assign one.</span>
        </div>
      ) : null}
      {myRv && !myRv.dec && (r.status === 'in_review' || r.status === 'changes') ? (
        <div className="flex flex-col gap-3.5 border-l-[3px] border-accent-bar py-2 pl-[18px]">
          <div className="flex flex-col gap-1">
            <span className="font-[650] text-accent-ink">Review decision</span>
            <span className="text-ink-5">
              {nRv > 1
                ? `You are one of ${nRv} reviewers; ${nAp} of ${nRv} have approved. Every reviewer must approve before submit. A note is required to request modification or deny.`
                : 'You are the assigned reviewer. A note is required to request modification or deny.'}
            </span>
          </div>
          <Textarea value={note} onChange={v => { setNote(v); setNoteErr(''); }} rows={3} placeholder="Review note" ariaLabel="Review note" />
          {noteErr ? <span className="text-danger" role="alert">{noteErr}</span> : null}
          <div className="flex flex-wrap gap-2.5">
            <Button variant="primary" icon="check" onClick={() => decide('approved')}>Approve</Button>
            <Button variant="secondary" icon="rotate-ccw" onClick={() => decide('changes')}>Request modification</Button>
            <Button variant="ghost" icon="ban" onClick={() => decide('denied')}>Deny</Button>
          </div>
        </div>
      ) : null}
      {wd.open ? (
        <div className="flex flex-col gap-3 rounded-md border border-[oklch(0.9_0.012_290)] bg-[oklch(0.985_0.004_290)] px-5 py-[18px]">
          <div className="flex flex-col gap-1">
            <span className="font-[650]">Withdraw this request</span>
            <span className="text-sm leading-normal text-pretty text-muted">Use this when plans change and the code won't be submitted, whatever the review result. It's counted as Withdrawn in Review outcomes.</span>
          </div>
          <Input value={wd.reason} onChange={v => setWd(w => ({ ...w, reason: v, err: '' }))} placeholder="Reason, e.g. feature dropped from the 2018 release" ariaLabel="Reason" />
          {wd.err ? <span className="text-danger" role="alert">{wd.err}</span> : null}
          <div className="flex flex-wrap gap-2.5">
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
        <div className="flex flex-wrap items-center gap-5 border-l-[3px] py-2 pl-[18px]" style={{ borderLeftColor: banner.fg }}>
          <div className="flex flex-[1_1_300px] flex-col gap-1.5">
            <span className="flex items-center gap-2 font-[650]" style={{ color: banner.fg }}><Icon name={banner.icon} size={16} />{banner.title}</span>
            <span className="leading-[1.6] text-ink-3">{banner.text}</span>
          </div>
          {r.status === 'changes' && isAuthor ? (
            <Button
              variant="primary"
              icon="refresh-cw"
              onClick={() => {
                upd(x => { const rv = x.reviewers.map(v => (v.dec === 'changes' ? { ...v, dec: null } : v)); return { ...log(x, 'resubmitted for review'), reviewers: rv, status: computeStatus(rv) }; });
                flash('Resubmitted · shelved files updated in Swarm');
              }}
            >
              Resubmit for review
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-9">
          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-muted">Summary of change</h3>
            <p className="leading-[1.75] whitespace-pre-wrap text-pretty">{r.desc}</p>
          </section>
          {r.attachments.length ? (
            <section className="flex flex-col gap-3.5">
              <h3 className="text-sm font-semibold text-muted">Attachments · {r.attachments.length}</h3>
              <Attachments items={r.attachments} />
            </section>
          ) : null}
          <RecordsAcrossSystems
            sub={rec.sub}
            legacyTitle="Legacy · IBM Rational and Review Board"
            legacy={rec.legacy}
            next={rec.next}
            synced={rec.synced}
            onSync={() => { setSynced(s => ({ ...s, all: 'just now' })); flash('Synced with ClearQuest, ClearCase, Review Board, Swarm, Jira and Confluence'); }}
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
          <section className="flex flex-col gap-5 border-t border-line pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-[650]">Changed files</h3>
                <span className="text-sm text-muted">{r.files.length ? `${r.files.length} file${r.files.length > 1 ? 's' : ''} · +${add} -${del} · Click a line to comment` : 'Not synced from Helix Swarm yet'}</span>
              </div>
              {r.files.length ? <div className="max-w-full overflow-x-auto"><Segmented ariaLabel="Diff layout" items={DIFF_MODES} value={mode} onValueChange={v => setPrefs({ diff: v as 'sbs' | 'uni' })} /></div> : null}
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
                  flash('Line comment added · synced to Swarm');
                }}
              />
            ))}
            {!r.files.length ? (
              <div className="flex items-start gap-4 rounded-md bg-accent-wash p-5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-soft"><Icon name="archive" size={20} color="oklch(0.5 0.17 293)" /></span>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-[650]">Files haven't been fetched from Helix Swarm yet</span>
                    <span className="max-w-[560px] leading-[1.6] text-muted">New requests only store the shelved changelist number. The changed files are loaded from Swarm review {sw.id} (shelved CL {sw.shelved}) on the next sync.</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Button variant="primary" icon="refresh-cw" onClick={fetchSwarm}>Fetch from Swarm</Button>
                    <Button variant="secondary" icon="external-link" onClick={() => flash(`Demo: this would open Helix Swarm review ${p4Of(r).swId}`)}>Open in Swarm</Button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          <section className="flex flex-col gap-[22px] border-t border-line pt-6">
            <h3 className="text-base font-[650]">Activity</h3>
            <ActivityFeed items={r.activity} />
            <Composer me={av(meId)} people={people} onPost={(t, att) => upd(x => ({ ...x, activity: [...x.activity, A('c', meId, nowStr(), t, null, att)] }))} />
          </section>
        </div>

        <aside className="flex min-w-[260px] flex-[0_1_300px] flex-col gap-7 border-l border-line pl-8 max-[900px]:border-l-0 max-[900px]:pl-0">
          <div className="flex flex-col gap-1.5">
            <SideLabel icon="clock">Review turnaround</SideLabel>
            <span className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em] tabular-nums" style={{ color: tat.color }}>{tat.text}</span>
            <span className="text-sm leading-normal text-muted">{tat.note}</span>
          </div>
          <Subscribers
            people={subPeople}
            count={subPeople.length + (subPeople.length === 1 ? ' person' : ' people')}
            note={sub ? (auto ? 'You are subscribed because you are ' + (isAuthor ? 'the author' : 'a reviewer') + '.' : 'You get notified about every update.') : 'Subscribe to get notified about every update.'}
          />
          <div className="flex flex-col gap-5 border-t border-line pt-6">
            <div className="flex flex-col gap-2.5">
              <SideLabel icon="user">Author</SideLabel>
              <span className="flex items-center gap-3">
                <Person person={av(r.author)} size={32} />
                <span className="flex flex-col gap-0.5"><span className="font-[550]">{UM[r.author].name}</span><span className="text-sm text-muted">{UM[r.author].title}</span></span>
              </span>
            </div>
            <div className="flex flex-col gap-3.5">
              <SideLabel icon="user-check" right={nRv ? `${nAp} of ${nRv} approved` : ''}>Reviewers</SideLabel>
              {r.reviewers.map(v => {
                const s2 = v.dec ? RST[v.dec] : { fg: MUTED, icon: 'clock' };
                return (
                  <div key={v.u} className="flex items-center gap-3">
                    <Person person={av(v.u)} size={32} />
                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <span className="font-[550]">{UM[v.u].name}</span>
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: s2.fg }}><Icon name={s2.icon} size={14} />{decLabel(v.dec)}</span>
                    </div>
                    {isCR && !v.dec && !final ? (
                      <Button variant="ghost" size="sm" icon="x" iconOnly title="Remove reviewer" onClick={() => upd(x => { const rv = x.reviewers.filter(y => y.u !== v.u); return { ...log(x, `removed ${UM[v.u].name} as reviewer`), reviewers: rv, status: computeStatus(rv) }; })} />
                    ) : null}
                  </div>
                );
              })}
              {!nRv ? <span className="text-faint">Not assigned yet</span> : null}
              {isCR && !final && r.status !== 'pending' && addable.length ? (
                <Combobox items={addable} value={null} onValueChange={v => v && addReviewer(v)} placeholder="Add reviewer" leadIcon="user-plus" dashed resetOnSelect />
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3.5 border-t border-line pt-6">
            <span className="text-muted">Stream</span><span className="font-mono text-sm break-all">{'//depot/printing/' + r.branch}</span>
            <span className="text-muted">Defect</span>
            <span>{r.linked ? <NextLink href={'/defects/' + r.linked}>{r.linked}</NextLink> : <span className="text-faint">None</span>}</span>
            <span className="text-muted">Submitted</span><span>{fFull(r.submitted)}</span>
            <span className="text-muted">Updated</span><span>{fAt(lastAt(r))}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
