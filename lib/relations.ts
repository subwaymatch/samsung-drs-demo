import { DST, MM, MODELS, MUTED, RST, SEV, SYSG, TYPE_ICON } from './constants';
import { LINE_OF, LINES, LINFO, affLines, affModels } from './products';
import { isOpen, migOf, simil, toks } from './records';
import type { Affects, Data, Defect, Option, Review } from './types';

export interface RelRow {
  id: string;
  title: string;
  meta: string;
  stL: string;
  stFg: string;
  stIcon: string;
  href: string;
}

/** Linked related items, plus suggestions that look related. */
export function relatedView(x: Defect | Review, all: (Defect | Review)[], isD: boolean) {
  const base = isD ? '/defects/' : '/reviews/';
  const st = (o: Defect | Review) => (isD ? DST[(o as Defect).status] : RST[(o as Review).status]);
  const rel = x.related || [], tk = toks(x.title);
  const fs = new Set(((x as Review).files || []).map(f => f.path));
  const why = (o: Defect | Review) => {
    const s = simil(tk, toks(o.title));
    if (isD) {
      const a = x as Defect, b = o as Defect;
      const sm = b.model === a.model, sp = b.comp === a.comp;
      return { sc: s + (sm ? 0.25 : 0) + (sp ? 0.15 : 0), ok: s >= 0.3 || (sm && sp), r: [sm && 'Same model ' + b.model, sp && 'Same component', s >= 0.34 && 'Similar title'] };
    }
    const a = x as Review, b = o as Review;
    const nf = (b.files || []).filter(f => fs.has(f.path)).length, sd = !!a.linked && b.linked === a.linked, sb = b.branch === a.branch;
    const sc = s + nf * 0.4 + (sd ? 1 : 0) + (sb ? 0.5 : 0);
    return { sc, ok: sc >= 0.5, r: [sd && 'Same defect ' + a.linked, nf && nf + ' shared file' + (nf > 1 ? 's' : ''), sb && 'Same branch', s >= 0.34 && 'Similar title'] };
  };
  const reason = (o: Defect | Review) => why(o).r.filter(Boolean).join(' · ');
  const row = (o: Defect | Review, meta: string): RelRow => {
    const s = st(o);
    return { id: o.id, title: o.title, meta, stL: s.l, stFg: s.fg, stIcon: s.icon, href: base + o.id };
  };
  const byId = new Map(all.map(o => [o.id, o]));
  const linked = rel.map(id => byId.get(id)).filter((o): o is Defect | Review => !!o).map(o => row(o, reason(o)));
  const rest = all.filter(o => o.id !== x.id && !rel.includes(o.id));
  const sugg = rest.map(o => ({ o, w: why(o) })).filter(z => z.w.ok).sort((a, b) => b.w.sc - a.w.sc).slice(0, 4).map(z => row(z.o, z.w.r.filter(Boolean).join(' · ')));
  const pick: Option[] = rest.map(o => ({
    value: o.id, label: o.id + ' · ' + o.title,
    icon: isD ? SEV[(o as Defect).sev].icon : TYPE_ICON[(o as Review).type], color: isD ? SEV[(o as Defect).sev].c : 'oklch(0.5 0.12 293)'
  }));
  return { linked, sugg, pick };
}

export interface AffChip { key: string; label: string; sub: string; icon: string; tip: string; primary: boolean; remove?: { kind: 'line' | 'model'; v: string } }

/** Chips for the affected products, and what can still be added. */
export function affectedView(model: string | null, a: Affects, inheritedFrom: string) {
  if (!model) return { chips: [] as AffChip[], addItems: [] as Option[], sub: 'No product recorded yet' };
  const lineMs = new Set(a.lines.flatMap(l => (LINFO[l] ? LINFO[l].models : [])));
  const all = [...new Set([model, ...a.models, ...lineMs])];
  const chips: AffChip[] = [
    { key: 'm:' + model, label: model, sub: 'Reported on', icon: 'printer', primary: true, tip: MM[model] ? MM[model].series + ' · ' + MM[model].kind : '' },
    ...a.lines.map(l => ({ key: 'l:' + l, label: l + ' line', sub: (LINFO[l] ? LINFO[l].models.length : 0) + ' models', icon: 'layers', primary: false, tip: LINFO[l] ? 'Shared base: ' + LINFO[l].plat + ' · ' + LINFO[l].models.join(', ') : '', remove: { kind: 'line' as const, v: l } })),
    ...a.models.filter(m => m !== model && !lineMs.has(m)).map(m => ({ key: 'm:' + m, label: m, sub: MM[m] ? MM[m].kind : '', icon: 'printer', primary: false, tip: '', remove: { kind: 'model' as const, v: m } }))
  ];
  const addItems: Option[] = [
    ...LINES.filter(l => !a.lines.includes(l)).map(l => ({ value: 'line:' + l, label: l + ' line', sub: `${LINFO[l].models.length} models · ${LINFO[l].plat}`, icon: 'layers', color: 'oklch(0.5 0.12 293)' })),
    ...MODELS.filter(m => !all.includes(m.id)).map(m => ({ value: m.id, label: m.id, sub: `${m.series} · ${m.kind}`, icon: 'printer', color: MUTED }))
  ];
  const nl = new Set(all.map(LINE_OF)).size;
  return {
    chips, addItems,
    sub: `${all.length} model${all.length === 1 ? '' : 's'} across ${nl} product line${nl === 1 ? '' : 's'}` + (inheritedFrom ? ` · inherited from ${inheritedFrom} until edited here` : '')
  };
}

export const addAffected = (a: Affects, v: string): Affects => {
  if (v.startsWith('line:')) {
    const l = v.slice(5), ms = LINFO[l] ? LINFO[l].models : [];
    return { lines: [...a.lines, l], models: a.models.filter(m => !ms.includes(m)) };
  }
  return { ...a, models: [...a.models, v] };
};
export const removeAffected = (a: Affects, r: { kind: 'line' | 'model'; v: string }): Affects =>
  r.kind === 'line' ? { ...a, lines: a.lines.filter(q => q !== r.v) } : { ...a, models: a.models.filter(q => q !== r.v) };

// ---- React Flow graphs ----

export interface GraphNode {
  id: string;
  type: 'card' | 'sys' | 'label';
  position: { x: number; y: number };
  draggable?: boolean;
  selectable?: boolean;
  data: Record<string, unknown> & { w: number; href?: string };
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  label?: string;
  animated?: boolean;
  dashed?: boolean;
}

/** The migration bridge: legacy systems on the left, new ones on the right, DRS in the middle. */
export function systemGraph(data: Data) {
  const D = data.defects, R = data.reviews;
  const cnt = (k: string) => D.filter(d => migOf(d) === k).length, jr = cnt('jira'), mr = cnt('mirrored'), lg = cnt('legacy');
  const meta: Record<string, { meta: string; href?: string }> = {
    'Rational ClearQuest': { meta: `${lg + mr} defects lead here`, href: '/defects?mig=legacy' },
    'Rational ClearCase': { meta: 'Frozen for waves 1 and 2' },
    'Review Board': { meta: 'Wave 3 teams still review here' },
    Jira: { meta: `${jr} lead · ${mr} mirrored`, href: '/defects?mig=jira' },
    'Perforce P4': { meta: `${D.reduce((a, d) => a + (d.p4 || []).length, 0) + R.filter(r => r.status === 'approved').length} changelists linked` },
    'Helix Swarm': { meta: `${R.length} code reviews`, href: '/reviews' },
    Confluence: { meta: 'Root-cause and test pages' }
  };
  const LBL: Record<string, string> = { 'Rational ClearQuest': 'Defects', 'Rational ClearCase': 'UCM history', 'Review Board': 'Reviews', Jira: 'Issues', 'Perforce P4': 'Jobs · CLs', 'Helix Swarm': 'Reviews', Confluence: 'Pages' };
  const W = 230, N: GraphNode[] = [], E: GraphEdge[] = [];
  const colY = (n: number, i: number) => (i - (n - 1) / 2) * 160;
  SYSG.forEach((g, gi) => {
    const x = gi === 0 ? -350 : 340;
    N.push({ id: 'lbl' + gi, type: 'label', position: { x, y: colY(g.items.length, 0) - 70 }, draggable: false, selectable: false, data: { w: W, label: g.label, note: g.note } });
    g.items.forEach((s, i) => {
      const id = 'sys:' + s.name;
      N.push({ id, type: 'sys', position: { x, y: colY(g.items.length, i) }, data: { w: W, name: s.name, role: s.role, logo: s.logo, sync: 'Synced ' + s.ago + ' ago', ...(meta[s.name] || {}) } });
      E.push(gi === 0
        ? { id: 'e' + id, source: id, target: 'hub', sourceHandle: 'sRight', targetHandle: 'tLeft', animated: true, label: LBL[s.name] }
        : { id: 'e' + id, source: 'hub', target: id, sourceHandle: 'sRight', targetHandle: 'tLeft', animated: true, label: LBL[s.name] });
    });
  });
  N.push({
    id: 'hub', type: 'sys', position: { x: -5, y: -5 },
    data: { hub: true, w: 240, name: 'DRS', logo: '/drs-logo.svg', role: 'Links each defect and code review across all seven systems', metaLines: [{ icon: 'bug', text: `${D.length} defects` }, { icon: 'git-pull-request', text: `${R.length} code reviews` }], sync: 'All systems connected' }
  });
  return { nodes: N, edges: E };
}

/** Relationship map for one defect: related defects, code reviews and product lines. */
export function defectGraph(d: Defect, D: Defect[], rel: { linked: RelRow[]; sugg: RelRow[] }, linkedR: Review[]) {
  const N: GraphNode[] = [], E: GraphEdge[] = [];
  const tint = { c: 'oklch(0.42 0.17 293)', b: 'oklch(0.95 0.035 293)' }, grey = { c: 'oklch(0.42 0.02 290)', b: 'oklch(0.95 0.008 290)' };
  const col = (n: number, i: number) => (i - (n - 1) / 2) * 112;
  N.push({ id: d.id, type: 'card', position: { x: 0, y: 0 }, data: { center: true, w: 220, kind: 'This defect', kc: '#fff', kb: 'oklch(0.5 0.19 293)', id: d.id, title: d.title, status: DST[d.status].l, sfg: DST[d.status].fg } });
  const rs = [...rel.linked.map(x => ({ ...x, sug: false })), ...rel.sugg.map(x => ({ ...x, sug: true }))];
  rs.forEach((x, i) => {
    N.push({ id: x.id, type: 'card', position: { x: -250, y: col(rs.length, i) }, data: { w: 200, dashed: x.sug, kind: x.sug ? 'Suggested' : 'Related defect', kc: x.sug ? grey.c : tint.c, kb: x.sug ? grey.b : tint.b, id: x.id, title: x.title, status: x.stL, sfg: x.stFg, tip: x.meta, href: x.href } });
    E.push({ id: 'e-' + x.id, source: x.id, target: d.id, sourceHandle: 'sRight', targetHandle: 'tLeft', dashed: x.sug });
  });
  linkedR.forEach((r, i) => {
    N.push({ id: r.id, type: 'card', position: { x: 270, y: col(linkedR.length, i) }, data: { w: 200, kind: 'Code review', kc: tint.c, kb: tint.b, id: r.id, title: r.title, status: RST[r.status].l, sfg: RST[r.status].fg, href: '/reviews/' + r.id } });
    E.push({ id: 'e-' + r.id, source: d.id, target: r.id, sourceHandle: 'sRight', targetHandle: 'tLeft' });
  });
  const own0 = LINE_OF(d.model), cl = affLines(d), mods = new Map<string, { via: string[]; ms: Set<string> }>();
  const addL = (o: Defect, isC: boolean) => affModels(o).forEach(m => {
    const l = LINE_OF(m);
    if (!mods.has(l)) mods.set(l, { via: [], ms: new Set() });
    const g = mods.get(l)!;
    if (isC) g.ms.add(m);
    if (!isC && !g.via.includes(o.id)) g.via.push(o.id);
  });
  addL(d, true);
  rs.forEach(x => {
    const o = D.find(z => z.id === x.id);
    if (o) addL(o, false);
  });
  const ms = [...mods.entries()].slice(0, 4), my = Math.max(220, Math.max(rs.length, linkedR.length, 1) * 56 + 130);
  ms.forEach(([m, g], i) => {
    const via = g.via, own = cl.includes(m), id = 'm:' + m;
    const n = D.filter(z => isOpen(z) && affLines(z).includes(m)).length, tot = (LINFO[m] || { models: [] }).models.length;
    N.push({
      id, type: 'card', position: { x: 15 + (i - (ms.length - 1) / 2) * 204, y: my },
      data: {
        w: 190, kind: 'Product line', kc: grey.c, kb: grey.b, id: m, title: own ? `${g.ms.size} of ${tot} models affected · ${n} open` : `${n} open defect${n === 1 ? '' : 's'} in this line`,
        tip: own ? 'Affected: ' + [...g.ms].join(', ') : 'Linked through ' + via.join(', ') + (LINFO[m] ? ' · base: ' + LINFO[m].plat : ''), status: '',
        href: '/defects?line=' + encodeURIComponent(m) + '&open=1'
      }
    });
    E.push({
      id: 'e-' + id, source: d.id, target: id, sourceHandle: 'sBottom', targetHandle: 'tTop', dashed: !own,
      label: m === own0 ? 'Reported on ' + d.model : own ? 'Also affected' : via.length === 1 ? 'Via ' + via[0] : `Via ${via.length} related`
    });
  });
  return { nodes: N, edges: E };
}
