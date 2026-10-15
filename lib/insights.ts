import { COMPS, MIG, MIGORD, MUTED, BAD, RST, SEV, SEVORD, TGT, TYPES, TYPE_ICON, UM, USERS, WAVE } from './constants';
import { addD, D0, dayIdx, ED, END, hrs, lbl, median, short, shortY, TNOW } from './dates';
import { av } from './people';
import { affLines, LINES, LINFO, rModelId, thumbOf } from './products';
import { firstDec, firstRes, isOpen, migOf, tgtEval } from './records';
import type { Data, Defect, Review, Severity } from './types';

export const RANGES: { n: number; label: string; icon: string }[] = [
  { n: 7, label: '7 days', icon: 'calendar-days' },
  { n: 30, label: '30 days', icon: 'calendar-range' },
  { n: 90, label: '90 days', icon: 'calendar-clock' },
  { n: 182, label: '6 months', icon: 'calendar' }
];

/** Build a query string, skipping empty values. */
export const qs = (o: Record<string, string | number | null | undefined>) =>
  Object.entries(o).filter(([, v]) => v != null && v !== '').map(([k, v]) => k + '=' + encodeURIComponent(String(v))).join('&');

const GREEN = 'oklch(0.62 0.14 155)', AMBER_BAR = 'oklch(0.78 0.14 75)', GOOD_TXT = 'oklch(0.48 0.12 155)', BAD_TXT = 'oklch(0.52 0.17 25)';
const tone = (p: number | null) => (p == null ? 'oklch(0.88 0.01 290)' : p >= 80 ? GREEN : p >= 50 ? AMBER_BAR : 'oklch(0.6 0.19 25)');

interface Bucket { s: number; e: number }
const buckets = (start: number, size: number): Bucket[] => {
  const out: Bucket[] = [];
  for (let e = ED; e > start; e -= size) out.unshift({ s: Math.max(start, e - size), e });
  // Fold a stub first bucket into the next full week.
  if (size === 7 && out.length > 1 && out[0].e - out[0].s <= 3) {
    out[1] = { s: out[0].s, e: out[1].e };
    out.shift();
  }
  return out;
};

export function computeInsights(data: Data, range: number) {
  const D = data.defects, R = data.reviews;
  const start = ED - range, pStart = Math.max(0, start - range), rangeL = RANGES.find(r => r.n === range)?.label || range + ' days';
  const fromK = addD(D0, start), T = fromK + ' 00:00';
  const bK = (b: Bucket) => addD(D0, b.s);
  const wq = (b: Bucket) => ({ from: bK(b), to: addD(D0, b.e) });
  const inB = (x: number, b: Bucket) => x >= b.s && x < b.e;
  const spanL = (b: Bucket) => (b.e - b.s === 1 ? lbl(bK(b)) : b.e - b.s === 7 ? `Week of ${short(bK(b))}` : `${short(bK(b))} – ${short(addD(D0, b.e - 1))}`);

  // Review turnaround: hours from submission to the first decision.
  const rv = R.filter(r => r.status !== 'withdrawn').map(r => {
    const f = firstDec(r);
    return f ? { r, w: dayIdx(r.submitted), hours: hrs(r.submitted, f.at), outcome: f.dec! } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);
  const cur = rv.filter(x => x.w >= start), prev = rv.filter(x => x.w >= pStart && x.w < start);
  const medC = median(cur.map(x => x.hours)), medP = median(prev.map(x => x.hours));
  const fp = (a: typeof cur) => (a.length ? (a.filter(x => x.outcome === 'approved').length / a.length) * 100 : 0);
  const fpC = fp(cur), fpP = fp(prev);
  const within = cur.length ? (cur.filter(x => x.hours <= 48).length / cur.length) * 100 : 0;

  const dv = D.map(d => ({ d, w: dayIdx(d.created), res: firstRes(d) }));
  const resIn = (a: number, b: number) => dv.filter(x => x.w >= a && x.w < b && x.res).map(x => hrs(x.d.created, x.res!) / 24);
  const rC = resIn(start, ED), rP = resIn(pStart, start);
  const openNow = D.filter(isOpen);
  const openThen = dv.filter(x => x.d.created < T && (!x.res || x.res >= T)).length;
  const per = `vs previous ${rangeL}`;
  const delta = (d: number, unit: string, lowerBetter: boolean, dec: number, p?: string) => ({
    delta: `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d).toFixed(dec)}${unit} ${p || per}`,
    dc: (lowerBetter ? d <= 0 : d >= 0) ? GOOD_TXT : BAD_TXT
  });
  const kpis = [
    { label: 'Median review turnaround', value: medC.toFixed(1), unit: 'h', ...delta(medC - medP, 'h', true, 1), sub: `${Math.round(within)}% decided within the 48h target`, href: '/reviews?' + qs({ from: fromK, to: END }) },
    { label: 'First-pass approval', value: fpC.toFixed(0), unit: '%', ...delta(fpC - fpP, ' pts', false, 1), sub: `${cur.length} review decisions`, href: '/reviews?' + qs({ outcome: 'approved', from: fromK, to: END }) },
    { label: 'Median time to resolve', value: median(rC).toFixed(1), unit: 'days', ...delta(median(rC) - median(rP), ' days', true, 1), sub: `${rC.length} defects resolved`, href: '/defects?' + qs({ by: 'resolved', from: fromK, to: END }) },
    { label: 'Open defects', value: String(openNow.length), unit: '', ...delta(openNow.length - openThen, '', true, 0, `since ${shortY(fromK)}`), sub: `${openNow.filter(d => d.sev === 'critical').length} critical`, href: '/defects?open=1' }
  ];

  // Turnaround chart
  const weeks = buckets(start, range <= 30 ? 1 : 7);
  const every = weeks.length > 20 ? 5 : weeks.length > 8 ? 2 : 1;
  const tatV = weeks.map(w => median(rv.filter(x => inB(x.w, w)).map(x => x.hours)));
  const tatN = weeks.map(w => rv.filter(x => inB(x.w, w)).length);
  const max = Math.max(72, Math.ceil(Math.max(...tatV) / 24) * 24);
  const ticks: { pos: string; l: string }[] = [];
  for (let v = 0; v <= max; v += 24) ticks.push({ pos: (v / max) * 100 + '%', l: v + 'h' });
  const tat = weeks.map((w, i) => ({
    ...(tatN[i]
      ? { h: (tatV[i] / max) * 100 + '%', c: tatV[i] > 48 ? AMBER_BAR : GREEN, tip: `${spanL(w)}: ${tatV[i].toFixed(1)}h median`, href: '/reviews?' + qs(wq(w)) }
      : { h: '2px', c: 'oklch(0.9 0.01 290)', tip: `${spanL(w)}: no review decisions`, href: '' }),
    label: (weeks.length - 1 - i) % every === 0 ? short(bK(w)) : '',
    ja: i === 0 && weeks.length > 1 ? 'flex-start' : i === weeks.length - 1 && weeks.length > 1 ? 'flex-end' : 'center'
  }));

  // Defects reported vs resolved
  const fwk = buckets(start, range <= 7 ? 1 : 7);
  const rep = fwk.map(w => dv.filter(x => inB(x.w, w)).length);
  const res = fwk.map(w => dv.filter(x => x.res && inB(dayIdx(x.res), w)).length);
  const fmax = Math.max(fwk.length && range <= 7 ? 5 : 10, Math.ceil(Math.max(...rep, ...res) / 5) * 5);
  const fStep = fmax <= 5 ? 1 : fmax <= 30 ? 5 : 10;
  const flowTicks: { pos: string; l: string }[] = [];
  for (let v = 0; v <= fmax; v += fStep) flowTicks.push({ pos: (v / fmax) * 100 + '%', l: String(v) });
  const fEvery = fwk.length > 20 ? 4 : fwk.length > 8 ? 2 : 1;
  const flow = fwk.map((w, i) => ({
    h1: (rep[i] / fmax) * 100 + '%', h2: (res[i] / fmax) * 100 + '%',
    tip1: `${spanL(w)}: ${rep[i]} reported`, tip2: `${spanL(w)}: ${res[i]} resolved`,
    label: (fwk.length - 1 - i) % fEvery === 0 ? short(bK(w)) : '',
    href1: '/defects?' + qs(wq(w)), href2: '/defects?' + qs({ by: 'resolved', ...wq(w) })
  }));
  const sr = rep.reduce((a, b) => a + b, 0), ssum = res.reduce((a, b) => a + b, 0);

  // Review outcomes
  const oc: Record<string, number> = { approved: 0, changes: 0, denied: 0, withdrawn: 0 };
  cur.forEach(x => oc[x.outcome]++);
  oc.withdrawn = R.filter(r => r.status === 'withdrawn' && dayIdx(r.submitted) >= start).length;
  const nOut = cur.length + oc.withdrawn, tot = Math.max(1, nOut);
  const ocDef = [
    { k: 'approved', label: 'Approved on first review', desc: 'Submitted without changes', c: GREEN },
    { k: 'changes', label: 'Modification requested', desc: 'Returned to the author for changes', c: 'oklch(0.8 0.13 75)' },
    { k: 'denied', label: 'Denied', desc: 'Change rejected by the review team', c: 'oklch(0.58 0.2 25)' },
    { k: 'withdrawn', label: 'Withdrawn', desc: 'Closed without submitting, e.g. plans changed and the code is no longer needed', c: 'oklch(0.66 0.02 290)' }
  ];
  const outcomes = ocDef.map(o => ({ ...o, n: oc[o.k], pct: ((oc[o.k] / tot) * 100).toFixed(1) + '%', href: '/reviews?' + qs({ outcome: o.k, from: fromK, to: END }) }));
  const raw = outcomes.map(o => (nOut ? (o.n / tot) * 100 : 0)), fl = raw.map(Math.floor);
  raw.map((r, i) => ({ i, f: r - fl[i] })).sort((a, b) => b.f - a.f).slice(0, nOut ? 100 - fl.reduce((a, b) => a + b, 0) : 0).forEach(x => fl[x.i]++);
  const waffle = outcomes.flatMap((o, i) => Array.from({ length: fl[i] }, () => ({ c: o.c, tip: `${o.label}: ${o.pct}`, href: o.href })));
  while (waffle.length < 100) waffle.push({ c: 'oklch(0.94 0.008 290)', tip: 'No decisions', href: '' });

  // Open defects by product line and severity
  const hk = [...SEVORD].reverse() as Severity[];
  const hN = (l: string, k: Severity) => openNow.filter(d => d.sev === k && affLines(d).includes(l)).length;
  const hl = LINES.map(l => ({ model: l, total: openNow.filter(d => affLines(d).includes(l)).length })).filter(x => x.total).sort((a, b) => b.total - a.total);
  const hMax = Math.max(1, ...hl.flatMap(m => hk.map(k => hN(m.model, k))));
  const heat = hl.map(m => ({
    model: m.model, sub: `${LINFO[m.model].models.length} models · ${LINFO[m.model].plat}`, total: m.total, href: '/defects?' + qs({ line: m.model, open: 1 }),
    cells: hk.map(k => {
      const n = hN(m.model, k), t = n / hMax;
      return {
        n: n ? String(n) : '–',
        bg: n ? `oklch(${(0.95 - t * 0.45).toFixed(3)} ${(0.04 + t * 0.15).toFixed(3)} 293)` : 'oklch(0.985 0.004 290)',
        fg: t > 0.5 ? '#fff' : n ? 'oklch(0.32 0.1 293)' : 'oklch(0.7 0.01 290)',
        tip: `${m.model} · ${SEV[k].l}: ${n} open`, href: '/defects?' + qs({ line: m.model, sev: k, open: 1 })
      };
    })
  }));
  const heatCols = hk.map(k => ({ l: SEV[k].l, icon: SEV[k].icon, c: SEV[k].c }));

  // Turnaround by change type
  const bt = TYPES.map(t => {
    const a = cur.filter(x => x.r.type === t);
    return { type: t, icon: TYPE_ICON[t], n: a.length, med: median(a.map(x => x.hours)), href: '/reviews?' + qs({ type: t, from: fromK, to: END }) };
  }).filter(t => t.n).sort((a, b) => b.n - a.n).slice(0, 5);
  const btMax = Math.max(72, Math.ceil(Math.max(0, ...bt.map(t => t.med)) / 24) * 24);
  const byType = bt.map(t => ({ ...t, v: t.med.toFixed(1) + 'h', w: (t.med / btMax) * 100 + '%', c: t.med > 48 ? AMBER_BAR : GREEN }));

  // Code review team
  const rd = R.flatMap(r => {
    const seen = new Set<string>();
    return r.activity.filter(a => a.t === 'd' && !seen.has(a.u) && seen.add(a.u)).map(a => ({ u: a.u, w: dayIdx(r.submitted), hours: hrs(r.submitted, a.at) }));
  }).filter(x => x.w >= start);
  const team = USERS.filter(u => u.role === 'cr').map(u => {
    const a = rd.filter(x => x.u === u.id);
    const p = a.length ? (a.filter(x => x.hours <= 48).length / a.length) * 100 : 0;
    return {
      id: u.id, u: av(u.id), n: a.length, med: a.length ? median(a.map(x => x.hours)).toFixed(1) + 'h' : '—', pct: a.length ? Math.round(p) + '%' : '—', pctW: p + '%', pc: tone(a.length ? p : null),
      queue: R.filter(x => (x.status === 'in_review' || x.status === 'changes') && x.reviewers.some(v => v.u === u.id && !v.dec)).length,
      href: '/reviews?' + qs({ reviewer: u.id, from: fromK, to: END })
    };
  }).sort((a, b) => b.n - a.n);

  // Most active items
  const cnt = (o: Defect | Review) => o.activity.filter(a => a.at >= T).length;
  const topD = D.map(d => ({ d, n: cnt(d) })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
  const topR = R.map(r => ({ r, n: cnt(r) })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
  const nb = range === 7 ? 7 : range === 30 ? 15 : 13, bsz = range / nb;
  const spark = (o: Defect | Review) => {
    const c = Array(nb).fill(0);
    o.activity.forEach(a => {
      if (a.at < T) return;
      const i = Math.min(nb - 1, Math.floor((dayIdx(a.at) - start) / bsz));
      if (i >= 0) c[i]++;
    });
    const m = Math.max(1, ...c);
    return c.map(v => ({ h: v ? Math.max(15, (v / m) * 100) + '%' : '2px', c: v ? 'oklch(0.58 0.16 293)' : 'oklch(0.92 0.01 290)' }));
  };
  const sparkTip = `Activity over the last ${rangeL}, ${bsz === 1 ? 'by day' : bsz === 2 ? 'in 2-day steps' : bsz <= 7 ? 'by week' : 'in 2-week steps'}`;
  const ppl = (o: Defect | Review) => {
    const ids = [...new Set(o.activity.filter(a => a.at >= T).sort((a, b) => (a.at < b.at ? 1 : -1)).map(a => a.u))], x = ids.length - 5;
    return { people: ids.slice(0, 5).map(av), more: x > 0 ? '+' + x : '', moreTip: x > 0 ? ids.slice(5).map(u => (UM[u] || { name: '' }).name).join(', ') : '', peopleL: ids.length + ' people active' };
  };
  const activeD = topD.map(({ d, n }) => {
    const c = d.activity.filter(a => a.t === 'c' && a.at >= T).length;
    return { ...ppl(d), id: d.id, th: thumbOf(d.model), title: d.title, icon: SEV[d.sev].icon, fg: SEV[d.sev].c, meta: `${d.model} · ${statusL(d)} · ${c} comment${c === 1 ? '' : 's'}`, n: String(n), nL: n === 1 ? 'update' : 'updates', spark: spark(d), sparkTip, href: '/defects/' + d.id };
  });
  const activeR = topR.map(({ r, n }) => ({
    ...ppl(r), id: r.id, th: thumbOf(rModelId(r, D)), title: r.title, icon: RST[r.status].icon, fg: RST[r.status].fg,
    meta: `${r.type} · ${RST[r.status].l} · ${r.reviewers.length} reviewer${r.reviewers.length === 1 ? '' : 's'}`, n: String(n), nL: n === 1 ? 'update' : 'updates', spark: spark(r), sparkTip, href: '/reviews/' + r.id
  }));

  // Migration
  const nD = D.length || 1, migs = D.map(migOf);
  const states = MIGORD.map(k => {
    const c = migs.filter(x => x === k).length;
    return { k, label: MIG[k].l, desc: MIG[k].d, c: MIG[k].c, n: c, pct: Math.round((c / nD) * 100) + '%', href: '/defects?' + qs({ mig: k }) };
  });
  const donut = donutGeometry(states);
  const compG = COMPS.map(c => ({ c, ds: D.filter(d => d.comp === c) })).filter(x => x.ds.length).sort((a, b) => (WAVE[a.c] || 3) - (WAVE[b.c] || 3) || b.ds.length - a.ds.length);
  const mxC = Math.max(1, ...compG.map(x => x.ds.length));
  const byComp = compG.map(({ c, ds }) => ({
    comp: c, wave: 'Wave ' + (WAVE[c] || 3), total: ds.length, w: (ds.length / mxC) * 100 + '%', href: '/defects?' + qs({ comp: c }),
    segs: MIGORD.map(k => ({ k, n: ds.filter(d => migOf(d) === k).length })).filter(s => s.n).map(s => ({ n: s.n, c: MIG[s.k].c, tip: `${c}: ${s.n} · ${MIG[s.k].l}`, href: '/defects?' + qs({ comp: c, mig: s.k }) }))
  }));

  // Severity targets for defects reported in the period
  const inP = D.filter(d => d.created >= T);
  const tg = ([...SEVORD].reverse() as Severity[]).map(k => {
    const t = TGT[k], ev = inP.filter(d => d.sev === k).map(d => tgtEval(d, TNOW));
    const rS = ev.filter(x => x.r.done || x.r.late), fS = ev.filter(x => x.f.done || x.f.late);
    const rp = rS.length ? (rS.filter(x => x.r.met).length / rS.length) * 100 : null;
    const fpp = fS.length ? (fS.filter(x => x.f.met).length / fS.length) * 100 : null;
    const late = D.filter(d => d.sev === k && isOpen(d) && tgtEval(d, TNOW).f.late).length;
    return {
      k, l: SEV[k].l, icon: SEV[k].icon, c: SEV[k].c, rl: t.rl, fl: t.fl,
      rp: rp == null ? '—' : Math.round(rp) + '%', rw: (rp || 0) + '%', rc: tone(rp),
      fp: fpp == null ? '—' : Math.round(fpp) + '%', fw: (fpp || 0) + '%', fc: tone(fpp),
      late: String(late), lateFg: late ? BAD : MUTED, href: '/defects?' + qs(late ? { sev: k, late: 1 } : { sev: k, open: 1 })
    };
  });

  return {
    kpis, tat, ticks, targetPos: (48 / max) * 100 + '%', gap: weeks.length <= 7 ? '20px' : weeks.length <= 13 ? '10px' : weeks.length <= 20 ? '6px' : '4px',
    bucketL: range <= 30 ? 'by day' : 'by week',
    periodL: `${shortY(fromK, addD(END, -1))} – ${short(addD(END, -1))}, ${addD(END, -1).slice(0, 4)}`,
    flow, flowTicks, flowGap: fwk.length <= 7 ? '20px' : fwk.length <= 13 ? '10px' : '4px',
    flowSub: range <= 7 ? 'Daily count' : 'Weekly count', flowNote: `${sr} reported and ${ssum} resolved in the last ${rangeL}.`,
    outcomes, waffle, outcomeSub: `${nOut} reviews submitted in the last ${rangeL}, by first decision or withdrawal`,
    heat, heatCols, byType, typeTarget: (48 / btMax) * 100 + '%', team, activeD, activeR,
    mig: { states, donut, total: String(D.length), sub: `All ${D.length} defects, by where their source of truth lives` }, byComp,
    tg, tgSub: `Defects reported in the last ${rangeL}. A response is the first comment or status change by someone other than the reporter.`
  };
}

const statusL = (d: Defect) => ({ open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' })[d.status];

/** Donut slices with leader lines and label positions, in a 520 × 280 box. */
function donutGeometry(states: { label: string; desc: string; c: string; n: number; pct: string; href: string }[]) {
  const total = states.reduce((a, s) => a + s.n, 0) || 1;
  const cx = 260, cy = 140, R = 82, r0 = 56, f1 = (v: number) => v.toFixed(1);
  const P = (a: number, rr: number) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  let a0 = -Math.PI / 2;
  const it = states.map(s => {
    const f = s.n / total, a1 = a0 + f * 2 * Math.PI, am = (a0 + a1) / 2, lg = f > 0.5 ? 1 : 0, ae = Math.min(a1, a0 + 2 * Math.PI - 1e-4);
    const [x0, y0] = P(a0, R), [x1, y1] = P(ae, R), [x2, y2] = P(ae, r0), [x3, y3] = P(a0, r0);
    const d = `M${f1(x0)},${f1(y0)} A${R},${R} 0 ${lg} 1 ${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)} A${r0},${r0} 0 ${lg} 0 ${f1(x3)},${f1(y3)} Z`;
    a0 = a1;
    const [ex, ey] = P(am, R + 3), [bx, by] = P(am, R + 22);
    return { s, d, right: Math.cos(am) >= 0, ex, ey, bx, by };
  });
  [true, false].forEach(side => {
    const g = it.filter(i => i.right === side).sort((a, b) => a.by - b.by);
    g.forEach(i => { i.by = Math.max(24, i.by); });
    for (let i = 1; i < g.length; i++) if (g[i].by - g[i - 1].by < 50) g[i].by = g[i - 1].by + 50;
    g.forEach(i => { i.by = Math.min(252, i.by); });
  });
  return it.map(i => {
    const lx = i.right ? cx + R + 40 : cx - R - 40;
    return {
      d: i.d, c: i.s.c, href: i.s.href, tip: i.s.label + ': ' + i.s.desc, label: i.s.label, val: `${i.s.n} · ${i.s.pct}`,
      lp: `${f1(i.ex)},${f1(i.ey)} ${f1(i.bx)},${f1(i.by)} ${lx},${f1(i.by)}`, dx: f1(i.ex), dy: f1(i.ey),
      lx: (((i.right ? lx + 8 : lx - 8) / 520) * 100).toFixed(2) + '%', ly: ((i.by / 280) * 100).toFixed(2) + '%',
      tr: i.right ? 'translate(0,-50%)' : 'translate(-100%,-50%)', ta: (i.right ? 'left' : 'right') as 'left' | 'right'
    };
  });
}

export type Insights = ReturnType<typeof computeInsights>;
