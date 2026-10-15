// Deterministic mock data: about twenty months of defects and code reviews from
// January 2016 to September 2017. The same seed always produces the same data,
// so the browser only has to store the viewer's own edits.

import { MIDS, MM, UM } from '../constants';
import { addD, byAt, D0, dayIdx, fmt, isWorkday, pad, TODAY } from '../dates';
import { A, computeStatus, diffCount, diffRows, DBG, F_ } from '../records';
import type { Activity, Attachment, Data, Decision, Defect, FileDiff, Review, Reviewer, Severity } from '../types';
import { HW_DEFECTS, HW_REVIEWS } from './handwritten';
import {
  APPROVE_N, ASK, ATT, BCI, CHANGES_N, CLEANUP, DCOMM, DENY_N, DT, FEAT, FIX, FT, FT_TYPE, LOC, PERF, REF, REPLY_N, RQ_N, SEC, TST, VERIFY
} from './templates';

/** Bump when the generator changes, so stored edits are not applied to different data. */
export const SEED_VERSION = 3;

function mulberry(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ASSIGN_BY_COMP: Record<string, string[]> = {
  'Print Engine': ['u2', 'u5', 'u22'], 'Scanner / ADF': ['u25', 'u5', 'u22'], Copy: ['u25', 'u5'], Fax: ['u17', 'u4'],
  'Network / Wi-Fi': ['u4', 'u10', 'u20'], 'SyncThru Web UI': ['u9', 'u26', 'u18'], 'Panel UI': ['u3', 'u21'],
  'Print Driver': ['u18', 'u27', 'u9'], 'Mobile Print': ['u20', 'u10', 'u21'], Security: ['u26', 'u30', 'u14'],
  Finisher: ['u33', 'u5', 'u10'], 'Toner / Supplies': ['u22', 'u2'], 'Power / Sleep': ['u17', 'u4']
};
const REP_BY_COMP: Record<string, string[]> = {
  Fax: ['u15', 'u1'], 'Scanner / ADF': ['u15', 'u1', 'u23'], Copy: ['u23', 'u1'], 'Print Driver': ['u16', 'u8'],
  'Network / Wi-Fi': ['u8', 'u1', 'u24'], 'SyncThru Web UI': ['u8', 'u24'], 'Mobile Print': ['u8', 'u16'], Security: ['u24', 'u8'],
  Finisher: ['u23', 'u1']
};
const QA = ['u1', 'u8', 'u15', 'u16', 'u23', 'u24'];
const ENGLISH = new Set(['u4', 'u8', 'u9', 'u13', 'u16', 'u20', 'u24', 'u27', 'u29', 'u31', 'u34']);
const BASE_W: Record<string, number> = { 'SL-C3060FR': 6, 'SL-M4080FX': 6, 'SL-X7600LX': 5, 'SL-M2020W': 4, 'SL-C480FW': 4, 'SL-M4070FR': 4, 'SL-K7600LX': 3, 'SL-M4580FX': 3 };
const TYPE_W: [string, number][] = [['Bug fix', 0.44], ['Feature', 0.18], ['Firmware update', 0.16], ['Refactor', 0.07], ['Security fix', 0.04], ['Localization', 0.04], ['Build / CI', 0.03], ['Performance', 0.02], ['Test', 0.02]];
const TAT_MULT: Record<string, number> = { 'Bug fix': 0.85, Feature: 1.4, 'Firmware update': 1.15, Refactor: 0.95, 'Security fix': 1.3, Localization: 0.6, 'Build / CI': 0.7, Performance: 1.1, Test: 0.75 };
const AUTHORS: Record<string, string[]> = {
  Feature: ['u3', 'u9', 'u10', 'u18', 'u19', 'u20', 'u21', 'u26', 'u27', 'u30', 'u31'],
  'Firmware update': ['u2', 'u4', 'u17', 'u25'], Refactor: ['u12', 'u13', 'u14', 'u2', 'u34'], 'Security fix': ['u26', 'u30', 'u14', 'u9'],
  Localization: ['u3', 'u21', 'u27'], 'Build / CI': ['u13', 'u34', 'u14'], Performance: ['u2', 'u17', 'u9', 'u25'], Test: ['u24', 'u15', 'u1']
};
const TITLES: Record<string, [string, string][]> = { Feature: FEAT, Refactor: REF, 'Security fix': SEC, Localization: LOC, 'Build / CI': BCI, Performance: PERF, Test: TST };
const BRANCH_ROOT: Record<string, string> = { Feature: 'feat/{m}/', Refactor: 'refactor/', 'Security fix': 'sec/', Localization: 'l10n/', 'Build / CI': 'build/', Performance: 'perf/{m}/', Test: 'test/' };
const DESC: Record<string, string> = {
  Feature: 'Adds the feature behind a model capability flag. Tested on {m} and one model from each series.',
  Refactor: 'No functional change. The regression suite passes on the build server.',
  'Security fix': 'Fixes a finding from the nightly security scan. Verified with the scan profile that reported it.',
  Localization: 'String and layout changes only. Checked on the 4.3-inch and 7-inch panels.',
  'Build / CI': 'Build infrastructure only; no firmware image changes. Verified with a dry run on the build farm.',
  Performance: 'Measured on {m}: see the attached timing comparison. No functional change.',
  Test: 'Adds automated coverage to the nightly regression suite.'
};
/** Reviewers who joined the Code Review Team in July 2016. */
const CR_JOINED: Record<string, string> = { u28: '2016-07-01', u29: '2016-07-01' };
const day0 = (k: string) => dayIdx(k);

const launchDay = (id: string) => {
  const l = MM[id].launch, q = +l.slice(6);
  return day0(l.slice(0, 4) + '-' + pad((q - 1) * 3 + 1) + '-01');
};

export function genFiles(r: Pick<Review, 'id' | 'title' | 'branch' | 'type'>, comp: string | null): FileDiff[] {
  const m = (r.title.match(/SL-[A-Z]\d+[A-Z]*/) || ['SL-M4080FX'])[0], ms = m.replace('SL-', '').toLowerCase();
  const slug = (r.branch.split('/').pop() || 'feature').replace(/-/g, '_');
  const sub = (t: string) => t.split('{s}').join(slug).split('{m}').join(ms).split('{M}').join(m);
  let t = (comp && FT[comp]) || FT_TYPE[r.type];
  if (!t) {
    const keys = Object.keys(FT);
    t = FT[keys[(+r.id.slice(3) || 0) % keys.length]];
  }
  let lines = t[1].map(sub);
  if (r.type === 'Firmware update') {
    const v = (r.title.match(/V\d+\.\d+\.\d+\.\d+/) || ['V4.00.03.20'])[0];
    const p = v.split('.');
    p[3] = String(Math.max(10, +p[3] - 3)).padStart(2, '0');
    lines = lines.map(l => l.split('{v}').join(v).split('{old}').join(p.join('.')));
  }
  const files: FileDiff[] = [{ path: sub(t[0]), lines, ...diffCount(lines) }];
  if (r.type !== 'Firmware update' && r.type !== 'Test' && r.type !== 'Build / CI' && r.type !== 'Localization') {
    const tl = ['@@ -0,0 +1,4 @@', '+TEST(' + ms + '_' + slug + ') {', '+\tASSERT_OK(run_scenario("' + r.branch.split('/').pop() + '"));', '+}', '+'];
    files.push({ path: 'test/unit/test_' + files[0].path.split('/').pop()!.replace(/\.\w+$/, '.c'), lines: tl, ...diffCount(tl) });
  }
  return files;
}

type GenDefect = Defect & { _hw?: boolean; _key?: string };
type GenReview = Review & { _hw?: boolean; _key?: string; _comp?: string | null };

export function seed(): Data {
  const rnd = mulberry(20160104);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const wpick = <T,>(a: T[], w: number[]) => {
    const tot = w.reduce((x, y) => x + y, 0);
    let r = rnd() * tot;
    for (let i = 0; i < a.length; i++) {
      r -= w[i];
      if (r < 0) return a[i];
    }
    return a[a.length - 1];
  };
  // Activity is generated up to early afternoon on TODAY.
  const CAPD = day0(TODAY) + 0.45;
  const NW = Math.ceil((CAPD + 1) / 7);
  const keyOf = (day: number) => addD(D0, Math.floor(day));
  /** Timestamp for a fractional day index, during office hours. */
  const at = (day: number) => {
    const di = Math.floor(day), fr = day - di;
    const d = new Date(2016, 0, 4 + di, 9 + Math.min(9, Math.floor(fr * 10)), Math.floor(rnd() * 60));
    return fmt(d);
  };
  /** Move a day off weekends and holidays. */
  const wkday = (day: number) => {
    let d = day;
    while (!isWorkday(keyOf(d))) d += 1;
    return d;
  };
  const period = (day: number) => (day < day0('2016-07-01') ? 1 : day < day0('2017-01-01') ? 2 : 3);
  const fwOf = (m: string, comp: string, day: number) => {
    const p = period(day), b = pad(10 + Math.floor(rnd() * 30));
    if (comp === 'Print Driver') return 'UPD 3.0' + (p + 1) + '.' + b;
    if (comp === 'Mobile Print') return 'Mobile Print 4.0' + p + '.' + b;
    const sr = MM[m].series;
    return (sr === 'MultiXpress' ? 'V5.10.0' : sr === 'ProXpress' ? 'V4.00.0' : 'V3.00.0') + p + '.' + b;
  };
  /** How many teams were on DRS: 55% in January 2016, everyone by mid-2016. */
  const adoption = (day: number) => Math.min(1, 0.55 + 0.45 * (day / day0('2016-07-01')));
  const weightsAt = (day: number) => MIDS.map(id => {
    const base = BASE_W[id] || 0.6, l = launchDay(id);
    if (day < l - 270) return 0;
    if (day <= l + 180) return Math.max(base, 1) * 3.5;
    return base;
  });

  // Durations are counted in working days, then mapped back to the calendar, so
  // nothing happens on weekends or holidays and a Friday request waits for Monday.
  const WORKDAYS: number[] = [];
  for (let d = 0; d <= CAPD + 400; d++) if (isWorkday(keyOf(d))) WORKDAYS.push(d);
  const BIZ = new Map(WORKDAYS.map((d, i) => [d, i]));
  const toBiz = (cal: number) => (BIZ.get(Math.floor(cal)) ?? 0) + (cal - Math.floor(cal));
  const toCal = (b: number) => {
    if (!isFinite(b)) return b;
    const i = Math.floor(b);
    return (WORKDAYS[i] ?? CAPD + 999) + (b - i);
  };

  // ---- Defects ----
  const defects: GenDefect[] = [];
  for (let w = 0; w < NW; w++) {
    const t = w / (NW - 1);
    const n = Math.round((8 + rnd() * 3 + Math.sin(w / 3) * 1.5) * adoption(w * 7));
    const mw = weightsAt(w * 7);
    for (let i = 0; i < n; i++) {
      const cd = wkday(w * 7 + rnd() * 7);
      if (cd >= CAPD - 0.05) continue;
      const tp = pick(DT), comp = tp[0], m = wpick(MIDS, mw), sev = wpick<Severity>(['trivial', 'minor', 'major', 'critical'], [0.1, 0.38, 0.38, 0.14]);
      const cands = ASSIGN_BY_COMP[comp];
      const a1 = pick(cands), as = rnd() < 0.25 ? [a1, pick(cands.filter(x => x !== a1))] : [a1];
      const rep = MM[m].series === 'MultiXpress' && rnd() < 0.5 ? 'u23' : pick(REP_BY_COMP[comp] || QA);
      const ko = /[가-힣]/.test(tp[1]);
      const act: Activity[] = [], c = at(cd), bc = toBiz(cd);
      act.push(A('e', rep, c, 'reported this defect'));
      as.forEach(u => act.push(A('e', rep, c, 'assigned ' + UM[u].name)));
      const mean = { critical: 2.2, major: 6, minor: 11, trivial: 17 }[sev] * (1.15 - 0.35 * t);
      const never = rnd() < 0.05;
      const resB = bc + 0.2 - Math.log(1 - rnd()) * mean;
      const ipB = bc + (resB - bc) * (0.12 + rnd() * 0.3);
      const closeB = rnd() < 0.7 ? resB + 1 + rnd() * 4 : Infinity;
      const resD = toCal(resB), ipD = toCal(ipB), closeD = toCal(closeB);
      const fw = fwOf(m, comp, cd);
      let status: Defect['status'] = 'open';
      if (rnd() < 0.08) act.push(A('c', a1, at(toCal(bc + 0.1)), ko ? ASK.ko : ASK.en));
      if (rnd() < 0.08) {
        const by = rnd() < 0.5 ? a1 : rep;
        act.push(A('e', by, at(toCal(bc + 0.15)), 'changed severity to ' + { critical: 'Critical', major: 'Major', minor: 'Minor', trivial: 'Trivial' }[sev]));
      }
      if (!never && ipD < CAPD) { act.push(A('e', a1, at(ipD), 'changed status to In progress')); status = 'in_progress'; }
      if (!never && rnd() < 0.45) {
        const cmD = toCal(ipB + (resB - ipB) * 0.5);
        if (cmD < CAPD) act.push(A('c', a1, at(cmD), pick(ko ? DCOMM.ko : DCOMM.en)));
      }
      if (!never && resD < CAPD) { act.push(A('e', a1, at(resD), 'changed status to Resolved')); status = 'resolved'; }
      if (!never && closeD < CAPD) {
        if (rnd() < 0.5) act.push(A('c', rep, at(toCal(closeB - 0.02)), (ENGLISH.has(rep) ? VERIFY.en : VERIFY.ko).replace('{fw}', fw.replace(/\d\d$/, x => pad(Math.min(99, +x + 2))))));
        act.push(A('e', rep, at(closeD), 'changed status to Closed'));
        status = 'closed';
      }
      // Stale reports from 2016 were closed in the Q1 2017 backlog review.
      if (never && cd < day0('2016-10-01')) {
        const cl = day0('2017-03-24') + 0.1 + rnd() * 0.4;
        act.push(A('c', 'u1', at(cl), CLEANUP), A('e', 'u1', at(cl + 0.01), 'changed status to Closed'));
        status = 'closed';
      }
      act.sort(byAt);
      const att: Attachment[] = [];
      if (rnd() < 0.32) {
        const pool = ATT[comp] || [];
        const k = rnd() < 0.35 ? 2 : 1;
        pool.slice(0, k).forEach(([name, size, type]) => att.push(F_(name.replace(/(\.\w+)$/, '_' + keyOf(cd).slice(5).replace('-', '') + '$1'), Math.round(size * (0.6 + rnd() * 0.8)), type)));
      }
      defects.push({
        id: '', title: tp[1].replace('{m}', m), model: m, comp, sev, status, fw, reporter: rep, assignees: as, created: c,
        desc: tp[2], steps: tp[3] && rnd() < 0.6 ? tp[3] : '', attachments: att, activity: act
      });
    }
  }
  HW_DEFECTS.forEach(h => defects.push({ steps: '', attachments: [], ...h, _hw: true, _key: h.id, activity: [...h.activity] } as GenDefect));
  defects.sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : 0));
  const yearSeq: Record<string, number> = {};
  const idMap: Record<string, string> = {};
  defects.forEach(d => {
    const yy = d.created.slice(2, 4);
    yearSeq[yy] = (yearSeq[yy] || 0) + 1;
    d.id = 'D-' + yy + '-' + String(yearSeq[yy]).padStart(4, '0');
    if (d._key) idMap[d._key] = d.id;
  });

  // ---- Code reviews ----
  const reviews: GenReview[] = [];
  const used = new Set<GenDefect>(defects.filter(d => d._hw));
  const genReview = (day: number, t: number, mw: number[]) => {
    let type = wpick(TYPE_W.map(x => x[0]), TYPE_W.map(x => x[1]));
    const sub = at(day), b = toBiz(day);
    let title = '', branch = '', author = '', linked: GenDefect | null = null, desc = '';
    const m = wpick(MIDS, mw), ms = m.replace('SL-', '').toLowerCase();
    if (type === 'Bug fix') {
      const cand = defects.filter(d => d.created < sub && !used.has(d)).slice(-15);
      if (cand.length) {
        const d = pick(cand);
        used.add(d);
        linked = d;
        title = pick(FIX[d.comp]) + ' (' + d.id + ')';
        author = d.assignees[0];
        branch = 'fw/' + d.model.replace('SL-', '').toLowerCase() + '/fix-' + d.id.slice(2).toLowerCase();
        desc = 'Fixes ' + d.id + ' on ' + d.model + '. Verified with the reproduction steps from the defect; the regression suite passes on the build server.';
      } else type = 'Feature';
    }
    if (type === 'Firmware update') {
      const v = fwOf(m, 'Print Engine', day);
      title = rnd() < 0.5 ? 'Firmware ' + v + ' release candidate (' + m + ')' : '펌웨어 ' + v + ' 배포 후보 (' + m + ')';
      branch = 'release/' + ms + '/' + v.toLowerCase();
      author = pick(AUTHORS[type]);
      desc = 'Release candidate build with all approved changes since the previous release for ' + m + '.';
    } else if (type !== 'Bug fix') {
      const f = pick(TITLES[type]);
      title = f[0].replace('{m}', m);
      branch = (BRANCH_ROOT[type] || 'misc/').replace('{m}', ms) + f[1];
      author = pick(AUTHORS[type]);
      desc = (DESC[type] || '').replace('{m}', m);
    }
    const act: Activity[] = [A('e', author, sub, 'requested a code review')];
    const crPool = ['u7', 'u6', 'u11', 'u28', 'u29'].filter(u => !CR_JOINED[u] || sub >= CR_JOINED[u]);
    const crW = crPool.map(u => (u === 'u28' && type === 'Security fix' ? 4 : u === 'u29' && ENGLISH.has(author) ? 1.2 : { u7: 0.3, u6: 0.25, u11: 0.3, u28: 0.15, u29: 0.2 }[u] || 0.2));
    const nRv = rnd() < 0.35 ? 2 : 1, rvIds: string[] = [];
    while (rvIds.length < nRv) {
      const u = wpick(crPool, crW);
      if (!rvIds.includes(u) && u !== author) rvIds.push(u);
    }
    const rv: Reviewer[] = [], asB = b + 0.03 + rnd() * 0.25, asD = toCal(asB);
    const base = (52 - 30 * t) * (TAT_MULT[type] || 1);
    const hours = Math.max(2, base * Math.exp((rnd() - 0.5) * 1.1));
    if (asD < CAPD) {
      const by = rnd() < 0.6 ? 'u7' : 'u6';
      rvIds.forEach(u => {
        act.push(A('e', by, at(asD), 'assigned ' + UM[u].name + ' as reviewer'));
        rv.push({ u, dec: null });
      });
      const roll = rnd();
      const outcome: Decision = roll < 0.025 ? 'denied' : roll < 0.025 + (0.42 - 0.14 * t) ? 'changes' : 'approved';
      const d1B = b + hours / 24, d1 = toCal(d1B);
      if (rnd() < 0.3) {
        const qB = asB + (d1B - asB) * 0.4, qd = toCal(qB);
        if (qd < CAPD) {
          act.push(A('c', rv[0].u, at(qd), pick(RQ_N)));
          const ad = toCal(qB + (d1B - qB) * 0.5);
          if (ad < CAPD && rnd() < 0.7) act.push(A('c', author, at(ad), pick(['Ran the full nightly suite; report attached to the Swarm review.', '네, 같은 플랫폼 모델 전체 빌드 확인했습니다.', 'Yes, covered by the regression suite as of last night.'])));
        }
      }
      if (d1 < CAPD) {
        act.push(A('d', rv[0].u, at(d1), pick(outcome === 'approved' ? APPROVE_N : outcome === 'changes' ? CHANGES_N : DENY_N), outcome));
        rv[0].dec = outcome;
        if (outcome === 'changes') {
          const rsB = d1B + 0.4 + rnd() * 1.2, rs = toCal(rsB);
          if (rs < CAPD) {
            if (rnd() < 0.5) act.push(A('c', author, at(toCal(rsB - 0.01)), pick(REPLY_N)));
            act.push(A('e', author, at(rs), 'resubmitted for review'));
            rv[0].dec = null;
            const d2 = toCal(rsB + 0.2 + rnd() * 0.9);
            if (d2 < CAPD) {
              act.push(A('d', rv[0].u, at(d2), pick(APPROVE_N), 'approved'));
              rv[0].dec = 'approved';
            }
          }
        }
      }
      if (rv[1] && outcome !== 'denied') {
        const d3 = toCal(b + (hours / 24) * (0.8 + rnd() * 0.5));
        if (d3 < CAPD) {
          act.push(A('d', rv[1].u, at(d3), pick(APPROVE_N), 'approved'));
          rv[1].dec = 'approved';
        }
      }
    }
    act.sort(byAt);
    reviews.push({
      id: '', title, type, branch, author, reviewers: rv, status: computeStatus(rv), linked: linked ? linked.id : '', submitted: sub, desc,
      files: [], attachments: [], activity: act, _comp: linked ? linked.comp : null
    });
  };
  for (let w = 0; w < NW; w++) {
    const n = Math.round((6 + rnd() * 3) * adoption(w * 7));
    const mw = weightsAt(w * 7);
    for (let i = 0; i < n; i++) {
      const day = wkday(w * 7 + rnd() * 7);
      if (day < CAPD - 0.1) genReview(day, w / (NW - 1), mw);
    }
  }
  // Requests sent in the last day and a half are still waiting on reviewers.
  [1.35, 0.9, 0.55, 0.3].forEach(back => genReview(CAPD - back, 1, weightsAt(CAPD)));
  HW_REVIEWS.forEach(h => reviews.push({ ...h, _hw: true, _key: h.id, linked: h.linked ? idMap[h.linked] || h.linked : '', activity: [...h.activity] }));
  reviews.sort((a, b) => (a.submitted < b.submitted ? -1 : a.submitted > b.submitted ? 1 : 0));
  reviews.forEach((r, i) => {
    r.id = 'CR-' + (1601 + i);
    if (r._key) idMap[r._key] = r.id;
    if (!r._hw) r.files = genFiles(r, r._comp ?? null);
  });

  // Replace "{D:key}" and "{CR:key}" placeholders in hand-written text.
  const fill = (s: string) => s.replace(/\{((?:D|CR):[a-z0-9]+)\}/g, (_, k: string) => idMap[k] || k);
  const fillAct = (a: Activity): Activity => ({ ...a, x: fill(a.x) });
  defects.forEach(d => {
    if (!d._hw) return;
    d.desc = fill(d.desc);
    d.activity = d.activity.map(fillAct);
  });
  reviews.forEach(r => {
    if (!r._hw) return;
    r.title = fill(r.title);
    r.desc = fill(r.desc);
    r.activity = r.activity.map(fillAct);
    r.files = r.files.map(f => ({ ...f, lines: f.lines.map(fill) }));
  });

  // Some reviews were withdrawn when plans changed.
  const WD_REASONS = ['Plans changed; this feature was dropped from the release.', 'Superseded by a different approach in another review.', 'The target model was cancelled, so this code is no longer used.'];
  reviews.forEach(r => {
    const n = +r.id.slice(3);
    if (r._hw || n % 9 !== 4 || r.status === 'denied' || !r.activity.length) return;
    const wAt = r.activity[r.activity.length - 1].at, reason = WD_REASONS[n % 3];
    r.activity.push(A('e', r.author, wAt, 'withdrew the request: ' + reason));
    r.status = 'withdrawn';
    r.withdrawn = { at: wAt, by: r.author, reason };
  });

  // Requests to verify, and questions for the default viewer (김지현), so the
  // demo opens with a realistic set of notifications.
  defects.filter(d => !d._hw && d.status === 'resolved' && d.assignees.length).slice(-20).forEach((d, i) => {
    if (i % 2) return;
    const wAt = d.activity[d.activity.length - 1].at, rep = UM[d.reporter];
    d.activity.push(A('c', d.assignees[0], wAt, ENGLISH.has(d.reporter) || ENGLISH.has(d.assignees[0])
      ? '@' + rep.name + ' The fix is on the build server. Could you verify it on your side?'
      : '@' + rep.name + ' 수정 펌웨어를 빌드 서버에 올렸습니다. 재검증 부탁드립니다.'));
  });
  defects.filter(d => !d._hw && (d.status === 'open' || d.status === 'in_progress') && d.reporter !== 'u1').slice(-10).forEach((d, i) => {
    if (i % 2) return;
    d.activity.push(A('c', d.reporter, d.activity[d.activity.length - 1].at, '@김지현 같은 증상이 SQA 회귀 테스트 장비에서도 재현되는지 확인 부탁드립니다.'));
  });

  // A line comment from the first decision on each review with files.
  reviews.filter(r => r.files.length).forEach(r => {
    const dec = r.activity.find(a => a.t === 'd');
    if (!dec) return;
    const row = diffRows(r.files[0]).sbs.find(x => !x.isHunk && x.rt && x.rbg === DBG.add);
    if (!row || row.isHunk) return;
    const x = dec.dec === 'approved' ? pick(['경계 조건 처리 확인했습니다. OK.', 'Checked this path on the bench. OK.', '로그 메시지 레벨 적절합니다.']) : pick(['이 값은 매직 넘버 대신 설정 매크로로 빼 주세요.', 'Please add a comment explaining why this is safe here.', '이 부분 에러 처리 누락되어 있습니다.']);
    r.lineComments = [{ f: 0, key: row.key, no: row.no, u: dec.u, at: dec.at, x }];
    r.activity.push(A('c', dec.u, dec.at, x, null, [], r.files[0].path + ':' + row.no));
    r.activity.sort(byAt);
  });

  const strip = <T extends object>(o: T) => {
    const c = { ...o } as Record<string, unknown>;
    delete c._hw;
    delete c._key;
    delete c._comp;
    return c as T;
  };
  return { defects: defects.map(d => strip(d) as Defect), reviews: reviews.map(r => strip(r) as Review) };
}

