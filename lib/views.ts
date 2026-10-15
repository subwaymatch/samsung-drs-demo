import { AMBER, CQ_PRI, CQ_STATE, DEC, GOOD, JIRA_ST, LOGO, MIG, MM, MUTED, RST, SEV, UM, WAVE } from './constants';
import { fDate, fDur, hrs, nowStr } from './dates';
import { affOf, modelInfo, rModelId } from './products';
import { ccOf, cqOf, cqOfReview, crNum, jiraOf, jobOf, migOf, migW, p4Of, rbOf, tgtEval } from './records';
import type { Defect, Review } from './types';

export interface SysRecord {
  sys: string;
  logo?: string;
  id: string;
  master: boolean;
  state: string;
  fg: string;
  meta: string;
}
const withLogo = (x: SysRecord): SysRecord => ({ ...x, logo: LOGO[x.sys] });

export interface Changelist { cl: string; status: string; icon: string; fg: string; desc: string; meta: string; at: string }

export function defectChangelists(d: Defect, linked: Review[]): Changelist[] {
  return [
    ...linked.map(r => {
      const p = p4Of(r);
      return p.submitted
        ? { cl: p.submitted, status: 'Submitted', icon: 'git-commit', fg: GOOD, desc: r.title, meta: `${UM[r.author].name} · //depot/printing/${r.branch}`, at: fDate(r.activity.length ? r.activity[r.activity.length - 1].at : r.submitted) }
        : { cl: p.shelved, status: 'Shelved', icon: 'archive', fg: MUTED, desc: r.title, meta: `${UM[r.author].name} · Swarm review ${p.swId} · ${r.id}`, at: fDate(r.submitted) };
    }),
    ...(d.p4 || []).map(c => ({ cl: c.cl, status: 'Submitted', icon: 'git-commit', fg: GOOD, desc: c.desc, meta: `${UM[c.u].name} · linked with p4 fix`, at: fDate(c.at) }))
  ];
}

const migSub = (mg: string, what: string, w: number) =>
  mg === 'legacy' ? `Tracked in ClearQuest only. A Jira issue is created when ${what} moves in wave ${w}.`
    : mg === 'mirrored' ? 'ClearQuest is the source of truth. DRS keeps the Jira copy in sync until cutover.'
      : 'Jira is the source of truth. The ClearQuest record is read-only and kept for history.';

export function defectRecords(d: Defect, cls: Changelist[], ago: string) {
  const mg = migOf(d), M = MIG[mg], w = WAVE[d.comp] || 3, cq = cqOf(d.id), cc = ccOf(w, MM[d.model] ? MM[d.model].series : '');
  const isDone = d.status === 'resolved' || d.status === 'closed';
  const conf = d.sev === 'critical' || d.sev === 'major' || isDone ? { id: 'Page ' + (48000 + crNumOfDefect(d) * 3), title: (isDone ? 'Root cause: ' : 'Investigation: ') + d.id } : null;
  const owner = d.assignees.length ? UM[d.assignees[0]].en : 'Unassigned';
  const sub = migSub(mg, d.comp, w);
  return {
    mig: { l: M.l, fg: M.fg, icon: M.icon, d: sub },
    sub,
    synced: 'Last synced across all systems ' + ago,
    legacy: [
      { sys: 'Rational ClearQuest', id: cq, master: mg !== 'jira', state: mg === 'jira' ? 'Read-only · moved to Jira' : CQ_STATE[d.status], fg: mg === 'jira' ? MUTED : 'inherit', meta: `Defect · ${CQ_PRI[d.sev]} · owner ${owner}` },
      { sys: 'Rational ClearCase', id: cq, master: false, state: cc.state, fg: 'inherit', meta: cc.meta }
    ].map(withLogo),
    next: [
      mg === 'legacy'
        ? { sys: 'Jira', id: '', master: false, state: 'Not created yet', fg: MUTED, meta: `Created when ${d.comp} moves to Jira in wave ${w}` }
        : { sys: 'Jira', id: jiraOf(d.id), master: mg === 'jira', state: JIRA_ST[d.status], fg: 'inherit', meta: (mg === 'jira' ? 'Project PRT · migrated from ' : 'Project PRT · mirrored from ') + cq },
      { sys: 'Perforce P4', id: jobOf(d.id), master: false, state: cls.length ? cls.length + ' changelist' + (cls.length > 1 ? 's' : '') + ' linked' : 'No changelists yet', fg: cls.length ? 'inherit' : MUTED, meta: 'Fixes recorded on the job with p4 fix' },
      conf
        ? { sys: 'Confluence', id: conf.id, master: false, state: conf.title, fg: 'inherit', meta: 'Space: Printing FW Quality' }
        : { sys: 'Confluence', id: '', master: false, state: 'No page yet', fg: MUTED, meta: 'Root-cause pages are written for major and critical defects' }
    ].map(withLogo)
  };
}
const crNumOfDefect = (d: Defect) => {
  const m = /^D-(\d\d)-(\d+)$/.exec(d.id);
  return m ? (+m[1] - 16) * 1000 + +m[2] : 0;
};

export function defectTargets(d: Defect) {
  const ev = tgtEval(d, nowStr()), RED = 'oklch(0.52 0.18 25)', PUR = 'oklch(0.45 0.17 293)';
  const r = ev.r.done
    ? ev.r.met ? { text: 'Responded in ' + fDur(ev.r.h), icon: 'circle-check', fg: GOOD } : { text: `Responded in ${fDur(ev.r.h)} · ${fDur(ev.r.h - ev.t.r)} late`, icon: 'circle-x', fg: RED }
    : ev.r.late ? { text: `No response · ${fDur(ev.r.h - ev.t.r)} overdue`, icon: 'triangle-alert', fg: RED } : { text: `${fDur(ev.t.r - ev.r.h)} left to respond`, icon: 'clock', fg: ev.t.r - ev.r.h < ev.t.r * 0.25 ? AMBER : PUR };
  const fh = ev.f.d * 24, th = ev.t.f * 24;
  const f: { text: string; icon: string; fg: string; sub?: string } = ev.f.done
    ? ev.f.met ? { text: 'Resolved in ' + fDur(fh), icon: 'circle-check', fg: GOOD } : { text: `Resolved in ${fDur(fh)} · ${fDur(fh - th)} late`, icon: 'circle-x', fg: RED }
    : ev.f.late ? { text: `Overdue by ${fDur(fh - th)}`, sub: 'Was due ' + ev.f.due, icon: 'triangle-alert', fg: RED } : { text: `${fDur(th - fh)} left`, sub: 'Due ' + ev.f.due, icon: 'clock', fg: th - fh < th * 0.25 ? AMBER : PUR };
  return { title: SEV[d.sev].l + ' severity targets', rl: ev.t.rl, fl: ev.t.fl, r, f };
}

const SWARM: Record<string, [string, string, string]> = {
  pending: ['Needs review', 'eye', 'oklch(0.48 0.18 293)'], in_review: ['Needs review', 'eye', 'oklch(0.48 0.18 293)'],
  changes: ['Needs revision', 'rotate-ccw', 'oklch(0.52 0.12 60)'], approved: ['Approved · committed', 'git-commit', GOOD],
  denied: ['Rejected', 'ban', 'oklch(0.52 0.18 25)'], withdrawn: ['Archived · not submitted', 'archive', 'oklch(0.48 0.01 290)']
};

export function reviewModel(r: Review, D: Defect[]) {
  const ld = r.linked ? D.find(x => x.id === r.linked) : undefined;
  return modelInfo(rModelId(r, D), ld ? ld.fw : '');
}

export function reviewRecords(r: Review, D: Defect[], swAgo: string, ago: string) {
  const ld = r.linked ? D.find(x => x.id === r.linked) : undefined;
  const n = crNum(r.id), p = p4Of(r);
  const sw = SWARM[r.status] || SWARM.pending;
  const failed = n % 9 === 0 && r.status !== 'approved';
  const swarm = {
    id: p.swId, state: sw[0], icon: sw[1], fg: sw[2], shelved: p.shelved, submitted: p.submitted,
    up: r.reviewers.filter(v => v.dec === 'approved').length, down: r.reviewers.filter(v => v.dec === 'changes' || v.dec === 'denied').length,
    tests: failed ? `Failed · build #${3000 + n * 3}` : `Passed · build #${3000 + n * 3}`, synced: 'Synced with Swarm ' + swAgo
  };
  const cqId = ld ? cqOf(ld.id) : cqOfReview(r);
  const cqType = ld ? 'Defect' : ({ Feature: 'Enhancement Request', 'Firmware update': 'Release Task', 'Bug fix': 'Defect', 'Security fix': 'Defect', Performance: 'Enhancement Request', Localization: 'Enhancement Request' } as Record<string, string>)[r.type] || 'Task';
  const cqState = ld ? CQ_STATE[ld.status] : r.status === 'approved' ? 'Resolved' : r.status === 'denied' ? 'Postponed' : r.status === 'withdrawn' ? 'Withdrawn' : r.status === 'pending' ? 'Submitted' : 'Opened';
  const onApprove = ld ? 'Resolve ' + cqId + ' as Fixed with CL ' + (p.submitted || p.shelved) : 'Resolve ' + cqId + ' as Complete';
  const rw = ld ? WAVE[ld.comp] || 3 : /^(web|drv|tools)\//.test(r.branch) ? 1 : /^(ui|net|sol|sec)\//.test(r.branch) ? 2 : 3;
  const mg = ld ? migOf(ld) : migW(rw, n), M = MIG[mg];
  const pm = reviewModel(r, D);
  const cc = ccOf(rw, pm.has ? pm.series : '');
  const jk = jiraOf(ld ? ld.id : r.id);
  const conf = r.status === 'approved' ? 'Test report: ' + r.id : r.type === 'Feature' || r.type === 'Firmware update' ? 'Design notes: ' + r.id : '';
  const sub = migSub(mg, 'this team', rw);
  const stream = '//depot/printing/' + r.branch;
  return {
    mig: { l: M.l, fg: M.fg, icon: M.icon, d: sub }, sub, swarm, synced: 'Last synced across all systems ' + ago,
    legacy: [
      { sys: 'Rational ClearQuest', id: cqId, master: mg !== 'jira', state: mg === 'jira' ? 'Read-only · moved to Jira' : cqState, fg: mg === 'jira' ? MUTED : 'inherit', meta: `${cqType} · on approval: ${onApprove}` },
      { sys: 'Rational ClearCase', id: cqId, master: false, state: cc.state, fg: 'inherit', meta: cc.meta },
      { sys: 'Review Board', id: rbOf(r), master: false, state: mg === 'legacy' ? 'Active · mirrored to Helix Swarm' : 'Read-only · history imported to Swarm', fg: mg === 'legacy' ? 'inherit' : MUTED, meta: mg === 'legacy' ? `Team moves to Helix Swarm in wave ${rw}` : 'Review comments and Ship It votes imported' }
    ].map(withLogo),
    next: [
      { sys: 'Helix Swarm', id: 'Review ' + p.swId, master: false, state: sw[0], fg: sw[2], meta: `${swarm.up} up · ${swarm.down} down · tests ${swarm.tests.toLowerCase()}` },
      { sys: 'Perforce P4', id: 'CL ' + (p.submitted || p.shelved), master: false, state: p.submitted ? 'Submitted' : 'Shelved', fg: 'inherit', meta: stream },
      mg === 'legacy'
        ? { sys: 'Jira', id: '', master: false, state: 'Not created yet', fg: MUTED, meta: `Created when this team moves to Jira in wave ${rw}` }
        : { sys: 'Jira', id: jk, master: mg === 'jira', state: ld ? JIRA_ST[ld.status] : cqState === 'Resolved' ? 'Done' : 'In Progress', fg: 'inherit', meta: (mg === 'jira' ? 'Project PRT · migrated from ' : 'Project PRT · mirrored from ') + cqId },
      conf
        ? { sys: 'Confluence', id: 'Page ' + (52000 + (n - 1500) * 3), master: false, state: conf, fg: 'inherit', meta: 'Space: Printing FW Engineering' }
        : { sys: 'Confluence', id: '', master: false, state: 'No page yet', fg: MUTED, meta: 'A test report page is added when the change is approved' }
    ].map(withLogo),
    affects: r.affects || (ld ? affOf(ld) : { lines: [], models: [] }),
    inheritedFrom: !r.affects && ld ? ld.id : '',
    pm
  };
}

export function reviewBanner(r: Review) {
  const decs = r.activity.filter(a => a.t === 'd'), last = decs[decs.length - 1], nRv = r.reviewers.length;
  let title = '', text = '';
  if (r.status === 'changes') {
    const lc = decs.filter(a => a.dec === 'changes').pop();
    if (lc) { title = 'Modification requested by ' + UM[lc.u].name; text = lc.x; }
  }
  if (last && r.status === 'approved') { title = nRv > 1 ? `Approved by all ${nRv} reviewers` : 'Approved for submit by ' + UM[last.u].name; text = last.x; }
  if (r.status === 'denied') {
    const ld = decs.filter(a => a.dec === 'denied').pop();
    if (ld) { title = 'Change denied by ' + UM[ld.u].name; text = ld.x; }
  }
  if (r.status === 'withdrawn' && r.withdrawn) { title = 'Withdrawn by ' + (UM[r.withdrawn.by] ? UM[r.withdrawn.by].name : 'the author'); text = r.withdrawn.reason || 'Closed without submitting.'; }
  return { title, text, icon: RST[r.status].icon, fg: RST[r.status].fg };
}

export function reviewTurnaround(r: Review) {
  const decs = r.activity.filter(a => a.t === 'd');
  const h = decs.length ? hrs(r.submitted, decs[0].at) : Math.max(0, hrs(r.submitted, nowStr()));
  return {
    text: h < 1 ? Math.max(1, Math.round(h * 60)) + 'm' : h.toFixed(1) + 'h',
    color: h > 48 ? 'oklch(0.55 0.13 65)' : 'oklch(0.45 0.17 293)',
    note: decs.length ? 'Submission to first decision · target 48h' : `Elapsed since submission, waiting on ${r.reviewers.length ? 'review' : 'assignment'} · target 48h`
  };
}

export const decLabel = (d: string | null | undefined) => (d ? DEC[d] : 'Reviewing');
