import { DEC, DST, MUTED, RST, SEV, SEVORD, TYPE_ICON, UM } from './constants';
import { addD, DAILY, lbl, short, TODAY, WEEKLY } from './dates';
import { qs } from './insights';
import type { Data, Defect, Severity } from './types';

export interface SummarySettings {
  daily: boolean;
  dailyTime: string;
  weekly: boolean;
  weeklyDay: string;
  weeklyTime: string;
  content: Record<ContentKey, boolean>;
  models: string[];
  minSev: Severity;
  cc: string[];
}
export type ContentKey = 'newDefects' | 'assigned' | 'resolved' | 'newReviews' | 'decisions';
export const DEF_SUM: SummarySettings = {
  daily: true, dailyTime: '08:30', weekly: true, weeklyDay: '1', weeklyTime: '09:00',
  content: { newDefects: true, assigned: true, resolved: true, newReviews: true, decisions: true },
  models: [], minSev: 'trivial', cc: []
};
export const CONTENT_L: [ContentKey, string][] = [
  ['newDefects', 'New defects'], ['assigned', 'Defects assigned to me'], ['resolved', 'Resolved and closed defects'],
  ['newReviews', 'New code review requests'], ['decisions', 'Code review decisions']
];

export type Kind = 'daily' | 'weekly';
export const keysOf = (kind: Kind) => (kind === 'daily' ? DAILY : WEEKLY);
/** The period an email covers: from the previous email up to its own date. */
export const periodOf = (kind: Kind, key: string) => {
  const keys = keysOf(kind), i = keys.indexOf(key);
  const s = kind === 'weekly' ? addD(key, -7) : i > 0 ? keys[i - 1] : addD(key, -3);
  return { s, e: key };
};

export interface DigestItem { id: string; icon: string; color: string; title: string; meta: string; href: string }
export interface DigestSection { key: ContentKey; title: string; icon: string; count: number; items: DigestItem[]; more: string; moreHref: string }

const RESOLVE_RE = /^changed status to (Resolved|Closed)$/;

export function buildEmail(data: Data, kind: Kind, key: string, ss: SummarySettings, me: string) {
  const meU = UM[me];
  const { s: sKey } = periodOf(kind, key);
  const s = sKey + ' 00:00', e = key + ' 00:00';
  const inR = (t: string) => t >= s && t < e;
  const dOK = (d: Defect) => SEVORD.indexOf(d.sev) >= SEVORD.indexOf(ss.minSev) && (!ss.models.length || ss.models.includes(d.model));
  const hasEv = (d: Defect, test: (x: string) => boolean) => d.activity.some(a => a.t === 'e' && inR(a.at) && test(a.x));
  const dItem = (d: Defect): DigestItem => ({ id: d.id, icon: SEV[d.sev].icon, color: SEV[d.sev].c, title: d.title, meta: `${d.model}, ${d.comp}, now ${DST[d.status].l.toLowerCase()}`, href: '/defects/' + d.id });
  const D = data.defects, R = data.reviews;
  const newD = D.filter(d => inR(d.created) && dOK(d));
  const assigned = D.filter(d => dOK(d) && hasEv(d, x => x === 'assigned ' + meU.name));
  const resolved = D.filter(d => dOK(d) && hasEv(d, x => RESOLVE_RE.test(x)));
  const newR = R.filter(r => inR(r.submitted));
  const decs = R.flatMap(r => r.activity.filter(a => a.t === 'd' && inR(a.at)).map(a => ({ r, a })));
  const sections: DigestSection[] = [];
  const add = (k: ContentKey, title: string, icon: string, items: DigestItem[], moreHref: string) => {
    if (!ss.content[k] || !items.length) return;
    sections.push({ key: k, title, icon, count: items.length, items: items.slice(0, 8), more: `View all ${items.length}`, moreHref });
  };
  add('newDefects', 'New defects', 'bug', newD.map(dItem), '/defects?' + qs({ from: sKey, to: key }));
  add('assigned', 'Assigned to you', 'user-check', assigned.map(dItem), '/defects?scope=mine');
  add('resolved', 'Resolved and closed', 'circle-check', resolved.map(dItem), '/defects?' + qs({ by: 'resolved', from: sKey, to: key }));
  add('newReviews', 'New code review requests', 'git-pull-request',
    newR.map(r => ({ id: r.id, icon: TYPE_ICON[r.type], color: MUTED, title: r.title, meta: `${r.type}, ${UM[r.author].name}`, href: '/reviews/' + r.id })),
    '/reviews?' + qs({ from: sKey, to: key }));
  add('decisions', 'Code review decisions', 'eye',
    decs.map(({ r, a }) => ({ id: r.id, icon: RST[a.dec!].icon, color: RST[a.dec!].fg, title: r.title, meta: `${DEC[a.dec!]} by ${UM[a.u].name}`, href: '/reviews/' + r.id })),
    '/reviews?' + qs({ from: sKey, to: key }));
  const lastK = addD(key, -1);
  const coverage = sKey === lastK ? lbl(sKey) : `${lbl(sKey)} - ${lbl(lastK)}`;
  const on = kind === 'daily' ? ss.daily : ss.weekly;
  return {
    subject: kind === 'daily' ? `[DRS] Daily summary, ${lbl(key)}` : `[DRS] Weekly summary, ${short(sKey)} - ${short(lastK)}`,
    sentAt: `${lbl(key)}, ${key.slice(0, 4)} at ${kind === 'daily' ? ss.dailyTime : ss.weeklyTime}`,
    greeting: `${meU.name}, here is the DRS activity for ${coverage}.`,
    stats: [{ label: 'New defects', n: newD.length }, { label: 'Resolved', n: resolved.length }, { label: 'Review requests', n: newR.length }, { label: 'Review decisions', n: decs.length }],
    sections,
    footer: (on ? `You receive this ${kind} summary because it is turned on in your DRS email settings.` : `The ${kind} summary is turned off. Earlier emails stay in this archive.`) +
      ` Models: ${ss.models.length ? ss.models.join(', ') : 'all'}, Minimum severity: ${SEV[ss.minSev].l}.`
  };
}

/**
 * Update counts for every email in the archive in one pass over the data.
 * Emails partition time, so each event belongs to exactly one email period.
 */
export function archiveTotals(data: Data, kind: Kind, ss: SummarySettings, me: string): Record<string, number> {
  const keys = keysOf(kind), meName = UM[me].name;
  const firstStart = periodOf(kind, keys[0]).s + ' 00:00';
  const ends = keys.map(k => k + ' 00:00');
  const idx = (t: string) => {
    if (t < firstStart || t >= ends[ends.length - 1]) return -1;
    let lo = 0, hi = ends.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ends[mid] > t) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  };
  const counts = new Array(keys.length).fill(0);
  const dOK = (d: Defect) => SEVORD.indexOf(d.sev) >= SEVORD.indexOf(ss.minSev) && (!ss.models.length || ss.models.includes(d.model));
  data.defects.forEach(d => {
    if (!dOK(d)) return;
    const i = idx(d.created);
    if (i >= 0) counts[i]++;
    const asg = new Set<number>(), res = new Set<number>();
    d.activity.forEach(a => {
      if (a.t !== 'e') return;
      if (a.x === 'assigned ' + meName) { const j = idx(a.at); if (j >= 0) asg.add(j); }
      if (RESOLVE_RE.test(a.x)) { const j = idx(a.at); if (j >= 0) res.add(j); }
    });
    asg.forEach(j => counts[j]++);
    res.forEach(j => counts[j]++);
  });
  data.reviews.forEach(r => {
    const i = idx(r.submitted);
    if (i >= 0) counts[i]++;
    r.activity.forEach(a => {
      if (a.t !== 'd') return;
      const j = idx(a.at);
      if (j >= 0) counts[j]++;
    });
  });
  return Object.fromEntries(keys.map((k, i) => [k, counts[i]]));
}

export const nextDaily = () => {
  let k = addD(TODAY, 1);
  while ([0, 6].includes(new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)).getDay())) k = addD(k, 1);
  return k;
};
