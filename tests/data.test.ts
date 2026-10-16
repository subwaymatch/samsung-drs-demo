// Invariants over the generated history: what a printer firmware team would
// expect to hold in real data.

import { describe, expect, it } from 'vitest';
import { MM, WAVE, WAVE_CUTOVER_DAY } from '@/lib/constants';
import { TNOW } from '@/lib/dates';
import { affModels, capsOf, hasCaps, rModelId } from '@/lib/products';
import { firstRes, p4Of } from '@/lib/records';
import { defectRecords, reviewRecords } from '@/lib/views';
import { fixOf, needsOf, seed, templateOf } from '@/lib/seed/generate';
import type { Defect, Review } from '@/lib/types';

const data = seed();
const D = data.defects, R = data.reviews;
const byId = new Map(D.map(d => [d.id, d]));
const lastApproval = (r: Review) => r.activity.filter(a => a.t === 'd' && a.dec === 'approved').pop()?.at ?? '';
const ids = (xs: { id: string }[]) => xs.map(x => x.id);

describe('model capabilities (M1)', () => {
  it('files every defect only on models that can have it', () => {
    const bad = D.filter(d => !affModels(d).every(m => hasCaps(m, needsOf(d))));
    expect(ids(bad)).toEqual([]);
  });
  it('names only fictional model ids', () => {
    expect(Object.keys(MM).every(id => id.startsWith('PS-'))).toBe(true);
    expect(D.some(d => /\bSL-[A-Z]\d/.test(d.title + d.desc))).toBe(false);
  });
  it('matches feature titles to the model they name', () => {
    const bad = R.filter(r => /Smart UX/.test(r.title) && !capsOf(rModelId(r, D)).has('smartux'));
    expect(ids(bad)).toEqual([]);
  });
});

describe('fix reviews (M2)', () => {
  const fixes = R.filter(r => r.linked && byId.get(r.linked) && templateOf(byId.get(r.linked)!) >= 0 && r.title.endsWith('(' + r.linked + ')'));
  it('has generated fix reviews to check', () => expect(fixes.length).toBeGreaterThan(100));
  it('titles each fix after its defect', () => {
    const bad = fixes.filter(r => {
      const f = fixOf(byId.get(r.linked)!)!;
      return ![f.en, f.ko].includes(r.title.slice(0, -(r.linked.length + 3)));
    });
    expect(ids(bad)).toEqual([]);
  });
  it('names only the defect model in the diff', () => {
    const bad = fixes.filter(r => {
      const m = byId.get(r.linked)!.model, short = m.slice(3).toLowerCase();
      const text = r.files.flatMap(f => [f.path, ...f.lines]).join('\n');
      const named = [...text.matchAll(/\b(?:PS-)?([MCKX]\d{3,4}[A-Z]*)\b/gi)].map(x => x[1].toLowerCase());
      return named.some(n => !short.startsWith(n.replace(/[a-z]+$/, '')) && n !== short);
    });
    expect(ids(bad)).toEqual([]);
  });
});

describe('defect and review timelines (M3)', () => {
  const linked = R.filter(r => r.linked && byId.has(r.linked));
  it('resolves a defect only after its fix review is approved', () => {
    const bad = linked.filter(r => {
      const d = byId.get(r.linked)!, res = firstRes(d);
      return r.status === 'approved' && res !== null && res < lastApproval(r);
    });
    expect(ids(bad)).toEqual([]);
  });
  it('never leaves a defect open once its fix is approved', () => {
    const bad = linked.filter(r => r.status === 'approved' && ['open', 'in_progress'].includes(byId.get(r.linked)!.status));
    expect(ids(bad)).toEqual([]);
  });
  it('keeps every activity at or after the record was created', () => {
    expect(ids(D.filter(d => d.activity.some(a => a.at < d.created)))).toEqual([]);
    expect(ids(R.filter(r => r.activity.some(a => a.at < r.submitted)))).toEqual([]);
  });
  it('records how every resolved defect was resolved', () => {
    expect(ids(D.filter(d => (d.status === 'resolved' || d.status === 'closed') && !d.resolution))).toEqual([]);
  });
  it('shows the change behind every fixed defect', () => {
    const approved = new Set(linked.filter(r => r.status === 'approved').map(r => r.linked));
    const bad = D.filter(d => d.resolution === 'fixed' && !approved.has(d.id) && !(d.p4 && d.p4.length));
    expect(ids(bad)).toEqual([]);
  });
  it('keeps status and activity in agreement', () => {
    const bad = D.filter((d: Defect) => {
      const last = [...d.activity].reverse().find(a => a.t === 'e' && /^changed status to /.test(a.x));
      const want = !last ? 'open' : /Closed$/.test(last.x) ? 'closed' : /Resolved$/.test(last.x) ? 'resolved' : /In progress$/.test(last.x) ? 'in_progress' : 'open';
      return want !== d.status;
    });
    expect(ids(bad)).toEqual([]);
  });
});

describe('legacy records (M4)', () => {
  const rows = [
    ...D.map(d => defectRecords(d, [], 'just now').legacy),
    ...R.map(r => reviewRecords(r, D, 'just now', 'just now').legacy)
  ].flat();
  it('gives each ClearCase stream a single state', () => {
    const states = new Map<string, Set<string>>();
    rows.filter(x => x.sys === 'Rational ClearCase' && x.state !== 'Not used').forEach(x => {
      const stream = /on (\w+)/.exec(x.meta)![1];
      states.set(stream, (states.get(stream) || new Set()).add(x.state));
    });
    expect([...states].filter(([, v]) => v.size > 1)).toEqual([]);
  });
  it('shows no Review Board record for reviews requested after the cutover', () => {
    const bad = R.filter(r => {
      const rb = reviewRecords(r, D, '', '').legacy.some(x => x.sys === 'Review Board');
      const d = r.linked ? byId.get(r.linked) : undefined;
      return rb && d && r.submitted >= WAVE_CUTOVER_DAY[WAVE[d.comp] || 3];
    });
    expect(ids(bad)).toEqual([]);
  });
  it('never reuses a changelist number', () => {
    const cls = [...D.flatMap(d => (d.p4 || []).map(c => c.cl)), ...R.flatMap(r => [p4Of(r).shelved, p4Of(r).submitted].filter(Boolean))];
    expect(cls.length - new Set(cls).size).toBe(0);
  });
});

describe('demo clock (T1)', () => {
  it('ends the recorded history at the demo time', () => {
    const late = [...D, ...R].filter(o => o.activity.some(a => a.at > TNOW));
    expect(ids(late)).toEqual([]);
  });
});
