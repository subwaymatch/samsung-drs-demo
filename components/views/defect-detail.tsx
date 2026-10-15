'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DST, DST_KEYS, RST, SEV, UM, USERS } from '@/lib/constants';
import { setDraft } from '@/lib/drafts';
import { fAt, fFull, nowStr } from '@/lib/dates';
import { isSubscribed } from '@/lib/notifications';
import { av, engineerOptions, personOption } from '@/lib/people';
import { affOf, affToVals, modelInfo } from '@/lib/products';
import { A, autoSub, jobOf, lastAt } from '@/lib/records';
import { addAffected, affectedView, defectGraph, relatedView, removeAffected } from '@/lib/relations';
import { deleteDefect, setSubscribed, updDefect, updReview, useApp } from '@/lib/store';
import type { Defect, DefectStatus, Severity } from '@/lib/types';
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

export function DefectDetail({ id }: { id: string }) {
  const app = useApp();
  const router = useRouter();
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
  if (!d || !derived || !prefs) return <NotFoundView />;

  const upd = (fn: (x: Defect) => Defect) => updDefect(d.id, fn);
  const log = (x: Defect, text: string): Defect => ({ ...x, activity: [...x.activity, A('e', meId, nowStr(), text)] });
  const setStatus = (k: DefectStatus) => {
    if (d.status === k) return;
    upd(x => ({ ...log(x, 'changed status to ' + DST[k].l), status: k }));
    flash(`${d.id} set to ${DST[k].l}`);
  };
  const rec = defectRecords(d, derived.cls, synced);
  const tg = defectTargets(d);
  const sub = isSubscribed(prefs.subs, d, meId), auto = autoSub(d, meId);
  const subPeople = USERS.filter(u => isSubscribed(prefs.subs, d, u.id)).map(u => av(u.id));
  const reporter = av(d.reporter);
  const pm = modelInfo(d.model, d.fw);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <Breadcrumb href="/defects" label="Defects" id={d.id} />
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <StatusLabel {...DST[d.status]} weight={600} />
            <span className="flex items-center gap-2"><Icon name={SEV[d.sev].icon} color={SEV[d.sev].c} size={16} />{SEV[d.sev].l}</span>
            <span title={rec.mig.d}><StatusLabel l={rec.mig.l} fg={rec.mig.fg} icon={rec.mig.icon} /></span>
          </div>
          <h1 className="text-2xl leading-[1.4] font-bold tracking-[-0.02em] text-pretty">{d.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={sub ? 'subOn' : 'secondary'}
            icon={sub ? 'bell-ring' : 'bell'}
            title={sub ? 'Click to stop notifications for this defect' : 'Get notified about comments, status changes and decisions'}
            onClick={() => { setSubscribed(d.id, meId, !sub); flash(sub ? 'Unsubscribed from ' + d.id : `Subscribed to ${d.id} · updates go to Notifications and your summary email`); }}
          >
            {sub ? 'Subscribed' : 'Subscribe'}
          </Button>
          <ActionGroup
            onPrimary={() => router.push(`/defects/${d.id}/edit`)}
            items={[
              d.status === 'closed'
                ? { icon: 'lock-open', label: 'Reopen', sub: 'Set status back to Open', onClick: () => { setStatus('open'); flash(d.id + ' reopened'); } }
                : { icon: 'lock', label: 'Close', sub: 'Mark as verified and closed', onClick: () => { setStatus('closed'); flash(d.id + ' closed · ClearQuest record closed'); } },
              { icon: 'copy-plus', label: 'Clone with changes', sub: 'Open a new report prefilled from this one', onClick: () => { setDraft({ kind: 'defect', cloneOf: d.id, title: d.title, aff: affToVals(affOf(d)), model: d.model, comp: d.comp, sev: d.sev, status: 'open', fw: d.fw, desc: d.desc, steps: d.steps, assignees: [...d.assignees] }); router.push('/defects/new'); } },
              { icon: 'git-pull-request', label: 'Request code review', sub: 'Start a review linked to this defect', onClick: () => router.push('/reviews/new?defect=' + d.id) },
              { icon: 'link-2', label: 'Copy link', onClick: () => { navigator.clipboard?.writeText(location.origin + '/defects/' + d.id).catch(() => {}); flash('Link copied'); } },
              { sep: true },
              { icon: 'trash-2', label: 'Delete', danger: true, onClick: () => setConfirmDel(true) }
            ]}
          />
        </div>
      </div>

      <div className="grid items-start gap-x-14 gap-y-7 border-t border-line pt-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]">
        <PersonCard label="Reported by" person={reporter} when={'Reported ' + fFull(d.created)} />
        <AffectedProducts
          {...derived.aff}
          onAdd={v => { const next = addAffected(affOf(d), v), msg = v.startsWith('line:') ? 'added product line ' + v.slice(5) : 'added ' + v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
          onRemove={c => { if (!c.remove) return; const next = removeAffected(affOf(d), c.remove), msg = c.remove.kind === 'line' ? 'removed product line ' + c.remove.v : 'removed ' + c.remove.v; upd(x => ({ ...log(x, msg), affects: next })); flash(msg[0].toUpperCase() + msg.slice(1)); }}
        />
      </div>
      <ProductPanel pm={pm} />
      {confirmDel ? (
        <ConfirmDelete id={d.id} noun="defect" onCancel={() => setConfirmDel(false)} onConfirm={() => { deleteDefect(d.id); flash(d.id + ' deleted'); router.push('/defects'); }} />
      ) : null}

      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-9">
          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-muted">Description</h3>
            <p className="leading-[1.75] whitespace-pre-wrap text-pretty">{d.desc}</p>
          </section>
          {d.steps ? (
            <section className="flex flex-col gap-2.5">
              <h3 className="text-sm font-semibold text-muted">Steps to reproduce</h3>
              <p className="border-l-2 border-accent-rule py-0.5 pl-4 leading-[1.8] whitespace-pre-wrap">{d.steps}</p>
            </section>
          ) : null}
          {d.attachments.length ? (
            <section className="flex flex-col gap-3.5">
              <h3 className="text-sm font-semibold text-muted">Attachments · {d.attachments.length}</h3>
              <Attachments items={d.attachments} />
            </section>
          ) : null}

          <RecordsAcrossSystems
            sub={rec.sub}
            legacyTitle="Legacy · IBM Rational"
            legacy={rec.legacy}
            next={rec.next}
            synced={rec.synced}
            onSync={() => { setSynced('just now'); flash('Synced with ClearQuest, ClearCase, Jira, P4 and Confluence'); }}
            onOpen={x => flash(`Demo: this would open ${x.sys} ${x.id}`)}
          />

          <section className="flex flex-col gap-4 border-t border-line pt-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-[650]">Relationship map</h3>
              <span className="text-sm leading-normal text-pretty text-muted">Related defects, code reviews and affected product lines. Click a card to open it; drag to pan.</span>
            </div>
            <div className="overflow-hidden rounded-md border border-[oklch(0.92_0.01_290)] bg-surface">
              <RelGraph nodes={derived.graph.nodes} edges={derived.graph.edges} height={540} />
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-ink-5">
              <span className="flex items-center gap-2"><span className="w-6 border-t-[1.5px] border-solid border-[oklch(0.55_0.17_293)]" />Linked</span>
              <span className="flex items-center gap-2"><span className="w-6 border-t-[1.5px] border-dashed border-[oklch(0.7_0.05_290)]" />Suggested or indirect</span>
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

          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-[650]">Linked code reviews</h3>
              <Button variant="ghost" size="sm" icon="git-pull-request" onClick={() => router.push('/reviews/new?defect=' + d.id)}>Request code review</Button>
            </div>
            <div className="flex flex-col">
              {derived.linked.map(r => (
                <Clickable key={r.id} href={'/reviews/' + r.id} className="row-link flex items-center gap-3.5 border-b border-line-soft py-3.5 last:border-b-0">
                  <span className="font-mono text-sm text-muted">{r.id}</span>
                  <span className="bui-trunc min-w-0 flex-1">{r.title}</span>
                  <StatusLabel {...RST[r.status]} />
                </Clickable>
              ))}
            </div>
            {!derived.linked.length ? <Note icon="git-pull-request" title="No code review linked yet" text="Request a code review when a fix is ready. Its Helix Swarm status will show here." /> : null}
          </section>

          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h3 className="flex items-center gap-2.5 text-base font-[650]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/perforce.svg" alt="" className="block h-[18px] w-auto" />
                  Perforce changelists
                </h3>
                <span className="text-sm text-muted">Fixes recorded on P4 job <span className="font-mono">{jobOf(d.id)}</span></span>
              </div>
              <Button variant="ghost" size="sm" icon="link" onClick={() => { setLinkCl(o => !o); setClInput(''); setClErr(''); }}>Link changelist</Button>
            </div>
            {linkCl ? (
              <>
                <div className="flex flex-wrap items-start gap-2.5 pt-1 pb-2">
                  <div className="flex-[1_1_220px]"><Input icon="git-commit" mono value={clInput} onChange={v => { setClInput(v); setClErr(''); }} placeholder="Changelist number, e.g. 1492310" ariaLabel="Changelist number" /></div>
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
                {clErr ? <span className="text-danger">{clErr}</span> : null}
              </>
            ) : null}
            <div className="flex flex-col">
              {derived.cls.map(c => (
                <div key={c.cl} className="grid grid-cols-[96px_110px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-soft py-3.5 last:border-b-0">
                  <span className="font-mono text-sm">{c.cl}</span>
                  <StatusLabel l={c.status} fg={c.fg} icon={c.icon} size={14} className="gap-1.5" />
                  <div className="flex min-w-0 flex-col gap-[3px]"><span className="bui-trunc">{c.desc}</span><span className="bui-trunc text-sm text-muted">{c.meta}</span></div>
                  <span className="text-sm whitespace-nowrap text-muted">{c.at}</span>
                </div>
              ))}
            </div>
            {!derived.cls.length ? <Note icon="git-commit" title="No changelists linked yet" text={`Fixes appear here once they are recorded on ${jobOf(d.id)} with p4 fix.`} /> : null}
          </section>

          <section className="flex flex-col gap-[22px] border-t border-line pt-6">
            <h3 className="text-base font-[650]">Activity</h3>
            <ActivityFeed items={d.activity} />
            <Composer me={av(meId)} people={people} onPost={(t, att) => upd(x => ({ ...x, activity: [...x.activity, A('c', meId, nowStr(), t, null, att)] }))} />
          </section>
        </div>

        <aside className="flex min-w-[260px] flex-[0_1_300px] flex-col gap-7 border-l border-line pl-8 max-[900px]:border-l-0 max-[900px]:pl-0">
          <div className="flex flex-col gap-4">
            <SideLabel icon="gauge">{tg.title}</SideLabel>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted">First response within {tg.rl}</span>
              <StatusLabel l={tg.r.text} fg={tg.r.fg} icon={tg.r.icon} weight={600} className="whitespace-normal" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted">Resolution within {tg.fl}</span>
              <StatusLabel l={tg.f.text} fg={tg.f.fg} icon={tg.f.icon} weight={600} className="whitespace-normal" />
              {tg.f.sub ? <span className="text-sm text-muted">{tg.f.sub}</span> : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-6">
            <SideLabel icon="circle-dot">Status</SideLabel>
            <div role="radiogroup" aria-label="Status" className="flex flex-col gap-0.5">
              {DST_KEYS.map(k => {
                const on = d.status === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setStatus(k)}
                    className="flex h-8 cursor-pointer items-center gap-2.5 rounded border-0 bg-transparent p-0 text-left text-sm font-[550] transition-[opacity,filter] hover:opacity-100 hover:[filter:none]"
                    style={{ color: on ? DST[k].fg : 'oklch(0.45 0.01 290)', filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.5 }}
                  >
                    <Icon name={DST[k].icon} size={16} />
                    <span>{DST[k].l}</span>
                    {on ? <Icon name="check" size={16} strokeWidth={2.5} /> : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SideLabel icon="flag">Severity</SideLabel>
            <Select ariaLabel="Severity" items={sevOptions()} value={d.sev} onValueChange={v => { if (v !== d.sev) upd(x => ({ ...log(x, 'changed severity to ' + SEV[v as Severity].l), sev: v as Severity })); }} />
          </div>
          <div className="flex flex-col gap-3.5">
            <SideLabel icon="users">Assignees</SideLabel>
            {d.assignees.map(u => {
              const p = av(u);
              return (
                <div key={u} className="flex items-center gap-3">
                  <Person person={p} size={32} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="font-[550]">{p.name}</span><span className="text-sm text-muted">{p.title}</span></div>
                  <Button variant="ghost" size="sm" icon="x" iconOnly title="Remove assignee" onClick={() => upd(x => ({ ...log(x, 'unassigned ' + UM[u].name), assignees: x.assignees.filter(y => y !== u) }))} />
                </div>
              );
            })}
            {!d.assignees.length ? (
              <div className="flex items-center gap-2.5 rounded-md bg-accent-wash px-3 py-2.5">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-soft"><Icon name="user-plus" size={16} color="oklch(0.5 0.17 293)" /></span>
                <span className="font-[550] text-ink-4">No one assigned yet</span>
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
          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3.5 border-t border-line pt-6">
            <span className="text-muted">Model</span><span className="font-[550]">{d.model}</span>
            <span className="text-muted">Component</span><span>{d.comp}</span>
            <span className="text-muted">Firmware</span><span className="font-mono text-sm">{d.fw}</span>
            <span className="text-muted">Reporter</span><span>{reporter.name}</span>
            <span className="text-muted">Created</span><span>{fFull(d.created)}</span>
            <span className="text-muted">Updated</span><span>{fAt(lastAt(d))}</span>
          </div>
          <Subscribers
            people={subPeople}
            count={subPeople.length + (subPeople.length === 1 ? ' person' : ' people')}
            note={sub ? (auto ? 'You are subscribed because you are ' + (d.reporter === meId ? 'the reporter' : 'an assignee') + '.' : 'You get notified about every update.') : 'Subscribe to get notified about every update.'}
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
