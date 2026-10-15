import { CQ_PRI, CQ_STATE, MIG, TGT, USERS, WAVE, WAVE_CUTOVER } from './constants';
import { hrs, MON, pd } from './dates';
import { seqOf } from './products';
import type { Activity, Attachment, Decision, Defect, FileDiff, MigState, Review, Reviewer, ReviewStatus } from './types';

/** Build an activity entry. */
export const A = (t: Activity['t'], u: string, at: string, x: string, dec?: Decision | null, att?: Attachment[], loc?: string): Activity => ({
  t, u, at, x, dec: dec ?? null, att: att || [], ...(loc ? { loc } : {})
});
export const F_ = (name: string, size: number, type: string): Attachment => ({ name, size, type });
export const diffCount = (lines: string[]) => ({ add: lines.filter(l => l[0] === '+').length, del: lines.filter(l => l[0] === '-').length });
export const FD = (path: string, lines: string[]): FileDiff => ({ path, lines, ...diffCount(lines) });
/** Reviewers from "u7" or "u11:approved" shorthands. */
export const RV = (...xs: string[]): Reviewer[] => xs.map(x => {
  const [u, dec] = x.split(':');
  return { u, dec: (dec as Decision) || null };
});

export const isDefect = (o: Defect | Review): o is Defect => (o as Defect).reporter !== undefined;
export const isOpen = (d: Defect) => d.status === 'open' || d.status === 'in_progress';
export const isActiveReview = (r: Review) => r.status === 'pending' || r.status === 'in_review' || r.status === 'changes';
export const lastAt = (o: Defect | Review) => (o.activity.length ? o.activity[o.activity.length - 1].at : isDefect(o) ? o.created : o.submitted);

export const computeStatus = (rv: Reviewer[]): ReviewStatus =>
  !rv.length ? 'pending'
    : rv.some(v => v.dec === 'denied') ? 'denied'
      : rv.some(v => v.dec === 'changes') ? 'changes'
        : rv.every(v => v.dec === 'approved') ? 'approved' : 'in_review';

/** When the defect was first resolved or closed. */
export const firstRes = (d: Defect) => {
  const a = d.activity.find(a => a.t === 'e' && /^changed status to (Resolved|Closed)$/.test(a.x));
  return a ? a.at : null;
};
/** First comment or status change by someone other than the reporter. */
export const firstResp = (d: Defect) => {
  const a = d.activity.find(a => a.u !== d.reporter && (a.t === 'c' || (a.t === 'e' && /^changed status/.test(a.x))));
  return a ? a.at : null;
};
export const firstDec = (r: Review) => r.activity.find(a => a.t === 'd') || null;

// Identifiers in the legacy and new systems, derived from the DRS id.

export const crNum = (id: string) => +id.slice(3) || 0;
export const cqOf = (id: string) => 'PRNT' + String(41000 + seqOf(id) * 7).padStart(8, '0');
export const jobOf = (id: string) => 'job' + String(seqOf(id) + 4000).padStart(6, '0');
export const jiraOf = (id: string) => 'PRT-' + (seqOf(id) + 1100);
export const p4Of = (r: Review) => {
  const n = crNum(r.id) - 1500;
  const shelved = r.cl || String(1300000 + n * 211);
  return { shelved, swId: String(+shelved + 2), submitted: r.status === 'approved' ? String(+shelved + 87) : '' };
};
export const rbOf = (r: Review) => 'r/' + (crNum(r.id) + 900);
export const cqOfReview = (r: Review) => 'PRNT' + String(60000 + (crNum(r.id) - 1500) * 11).padStart(8, '0');

/** Where a record's source of truth lives, given its component's wave. */
export const migW = (w: number, n: number): MigState => {
  const h = n % 5;
  return w === 1 ? (h === 0 ? 'mirrored' : 'jira') : w === 2 ? (h < 3 ? 'mirrored' : h === 3 ? 'jira' : 'legacy') : h === 0 ? 'mirrored' : 'legacy';
};
export const migOf = (d: Defect) => migW(WAVE[d.comp] || 3, seqOf(d.id));
export const migInfo = (k: MigState) => MIG[k];

export const ccOf = (w: number, series: string) => {
  const stream = (series || 'printing').toLowerCase() + '_fw_int';
  return w < 3
    ? { state: 'Read-only · history imported to P4', meta: `UCM activity on ${stream} · frozen ${WAVE_CUTOVER[w]}` }
    : { state: 'Active · imported to P4 every hour', meta: `UCM activity on ${stream} · cutover ${WAVE_CUTOVER[3]}` };
};
export const cqPri = CQ_PRI;
export const cqState = CQ_STATE;

/** Response and resolution against the severity targets. */
export const tgtEval = (d: Defect, now: string) => {
  const t = TGT[d.sev] || TGT.minor, ra = firstResp(d), fa = firstRes(d);
  const rh = Math.max(0, hrs(d.created, ra || now)), fd = Math.max(0, hrs(d.created, fa || now) / 24);
  const due = new Date(pd(d.created).getTime() + t.f * 864e5);
  return {
    t,
    r: { done: !!ra, h: rh, met: !!ra && rh <= t.r, late: rh > t.r },
    f: { done: !!fa, d: fd, met: !!fa && fd <= t.f, late: fd > t.f, due: MON[due.getMonth()] + ' ' + due.getDate() }
  };
};

// Diffs

export const DBG = {
  add: 'oklch(0.975 0.03 155)', del: 'oklch(0.975 0.025 25)', none: 'transparent',
  addFg: 'oklch(0.33 0.08 155)', delFg: 'oklch(0.4 0.12 25)', ctx: 'oklch(0.4 0.02 290)'
};
export interface HunkRow { isHunk: true; text: string }
export interface UniRow { isHunk: false; ln: number | ''; rn: number | ''; sign: string; text: string; bg: string; fg: string; key: string; no: number }
export interface SbsRow { isHunk: false; ln: number | ''; lt: string; lbg: string; lfg: string; rn: number | ''; rt: string; rbg: string; rfg: string; key: string; no: number }

export function diffRows(f: FileDiff) {
  let ln = 1, rn = 1;
  let dels: { no: number; text: string }[] = [], adds: { no: number; text: string }[] = [];
  const uni: (HunkRow | UniRow)[] = [], sbs: (HunkRow | SbsRow)[] = [];
  const flush = () => {
    const n = Math.max(dels.length, adds.length);
    for (let i = 0; i < n; i++) {
      const d = dels[i], a = adds[i];
      sbs.push({
        isHunk: false, ln: d ? d.no : '', lt: d ? d.text : '', lbg: d ? DBG.del : DBG.none, lfg: DBG.delFg,
        rn: a ? a.no : '', rt: a ? a.text : '', rbg: a ? DBG.add : DBG.none, rfg: DBG.addFg,
        key: a ? 'R' + a.no : 'L' + d.no, no: a ? a.no : d.no
      });
    }
    dels = [];
    adds = [];
  };
  (f.lines || []).forEach(l => {
    const c = l[0], text = l.slice(1);
    if (c === '@') {
      flush();
      const m = /-(\d+)(?:,\d+)? \+(\d+)/.exec(l);
      if (m) { ln = +m[1]; rn = +m[2]; }
      uni.push({ isHunk: true, text: l });
      sbs.push({ isHunk: true, text: l });
      return;
    }
    if (c === '-') {
      uni.push({ isHunk: false, ln, rn: '', sign: '-', text, bg: DBG.del, fg: DBG.delFg, key: 'L' + ln, no: ln });
      dels.push({ no: ln++, text });
      return;
    }
    if (c === '+') {
      uni.push({ isHunk: false, ln: '', rn, sign: '+', text, bg: DBG.add, fg: DBG.addFg, key: 'R' + rn, no: rn });
      adds.push({ no: rn++, text });
      return;
    }
    flush();
    uni.push({ isHunk: false, ln, rn, sign: '', text, bg: DBG.none, fg: DBG.ctx, key: 'R' + rn, no: rn });
    sbs.push({ isHunk: false, ln, lt: text, lbg: DBG.none, lfg: DBG.ctx, rn, rt: text, rbg: DBG.none, rfg: DBG.ctx, key: 'R' + rn, no: rn });
    ln++;
    rn++;
  });
  flush();
  return { uni, sbs };
}

// @mentions

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NAMES_RE = new RegExp('@(' + USERS.map(u => u.name).sort((a, b) => b.length - a.length).map(esc).join('|') + ')', 'g');
export interface TextPart { t: string; mention: boolean }
/** Split text into plain runs and @mentions of known people. */
export const parts = (t: string): TextPart[] => {
  const s = String(t || ''), out: TextPart[] = [];
  let last = 0;
  s.replace(NAMES_RE, (m: string, _n: string, i: number) => {
    if (i > last) out.push({ t: s.slice(last, i), mention: false });
    out.push({ t: m, mention: true });
    last = i + m.length;
    return m;
  });
  if (last < s.length) out.push({ t: s.slice(last), mention: false });
  return out;
};

// Similarity, for duplicate detection and related-item suggestions

export const toks = (s: string) =>
  new Set(String(s).toLowerCase().replace(/\[[^\]]*\]/g, ' ').split(/[^a-z0-9가-힣]+/).filter(w => w.length >= 2));
export const simil = (a: Set<string>, b: Set<string>) => {
  let n = 0;
  a.forEach(w => { if (b.has(w)) n++; });
  return a.size && b.size ? n / Math.min(a.size, b.size) : 0;
};

/** People are subscribed automatically when they report, are assigned, author or review. */
export const autoSub = (o: Defect | Review, u: string) =>
  isDefect(o) ? o.reporter === u || o.assignees.includes(u) : o.author === u || o.reviewers.some(v => v.u === u);
