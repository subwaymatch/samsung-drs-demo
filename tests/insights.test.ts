// Insights numbers that a visitor can add up on screen must agree.

import { describe, expect, it, vi } from 'vitest';
import { computeInsights, RANGES } from '@/lib/insights';
import { isOpen } from '@/lib/records';
import { seed } from '@/lib/seed/generate';

const data = seed();

describe.each(RANGES.map(r => [r.label, r.n] as const))('Insights for %s', (_, n) => {
  const st = computeInsights(data, n);
  it('counts the same resolved defects on the KPI card and the chart (D1)', () => {
    const kpi = st.kpis.find(k => k.label === 'Median time to resolve')!;
    const chart = st.flow.reduce((a, b) => a + b.res, 0);
    expect(kpi.sub).toBe(`${chart} defect${chart === 1 ? '' : 's'} resolved`);
    expect(st.flowNote).toContain(`and ${chart} resolved`);
  });
  it('reconciles the heatmap with the open defects KPI (D2)', () => {
    const open = data.defects.filter(isOpen);
    expect(st.heatUnique.total).toBe(open.length);
    expect(st.kpis.find(k => k.label === 'Open defects')!.value).toBe(String(open.length));
    expect(st.heatUnique.cells.reduce((a, b) => a + b, 0)).toBe(open.length);
  });
  it('limits open past target to defects reported in the period (D3)', () => {
    const late = st.tg.reduce((a, t) => a + Number(t.late), 0);
    const reported = st.flow.reduce((a, b) => a + b.rep, 0);
    expect(late).toBeLessThanOrEqual(reported);
  });
  it('never writes "1 reviews" or "1 defects"', () => {
    expect(JSON.stringify(st)).not.toMatch(/\b1 (reviews|defects|decisions|review decisions)\b/);
  });
});

describe('demo clock (T1)', () => {
  const at = async (time: string) => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`2026-10-16T${time}:00`));
    const { seed: s } = await import('@/lib/seed/generate');
    const { defectTargets, reviewTurnaround } = await import('@/lib/views');
    const { nowStr } = await import('@/lib/dates');
    const d = s();
    const out = JSON.stringify({
      now: nowStr(),
      t: d.defects.filter(isOpen).map(defectTargets),
      r: d.reviews.filter(r => r.status === 'in_review' || r.status === 'pending').map(reviewTurnaround)
    });
    vi.useRealTimers();
    return out;
  };
  it('shows the same durations at 08:00 and 22:00', async () => {
    const a = await at('08:00'), b = await at('22:00');
    expect(a).toBe(b);
    expect(JSON.parse(a).now).toBe('2017-09-15 18:00');
  });
});
