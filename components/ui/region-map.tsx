'use client';

import { useMemo } from 'react';
import { MAP_ROWS } from '@/lib/region-map';

const CODES: Record<string, string> = { Korea: 'k', Japan: 'j', China: 'c', SEA: 's', Americas: 'a', Europe: 'e', CIS: 'i', MEA: 'm' };
/** Regions only a dot or two across; they get a ring so they stay visible. */
const SMALL = ['k', 'j'];

const COLS = MAP_ROWS[0].length;
const ROWS = MAP_ROWS.length;
const R = 0.36;
const dot = (c: number, r: number) => `M${c + 0.5 - R} ${r + 0.5}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`;

/** Region letters named in a sales region label such as "Europe, CIS, MEA"; null means every region. */
const codesOf = (label: string) => (/Global/.test(label) ? null : new Set(label.split(/,\s*/).map(n => CODES[n]).filter(Boolean)));

function draw(label: string) {
  const want = codesOf(label);
  let on = '';
  let off = '';
  const small: [number, number][] = [];
  MAP_ROWS.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const hit = !want || want.has(ch);
      if (hit) on += dot(c, r);
      else off += dot(c, r);
      if (want && hit && SMALL.includes(ch)) small.push([c + 0.5, r + 0.5]);
    }
  });
  let ring = null;
  if (small.length) {
    const cx = small.reduce((a, p) => a + p[0], 0) / small.length;
    const cy = small.reduce((a, p) => a + p[1], 0) / small.length;
    ring = { cx, cy, r: Math.max(...small.map(p => Math.hypot(p[0] - cx, p[1] - cy))) + 1.5 };
  }
  return { on, off, ring };
}

/** A dot map of the world with the regions in a sales region label highlighted. */
export function RegionMap({ label }: { label: string }) {
  const { on, off, ring } = useMemo(() => draw(label), [label]);
  return (
    <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="block h-auto w-full max-w-[240px]" role="img" aria-label={'World map highlighting ' + label}>
      <path d={off} fill="oklch(0.87 0.012 290)" />
      <path d={on} fill="var(--color-accent-bar)" />
      {ring ? <circle cx={ring.cx} cy={ring.cy} r={ring.r} fill="none" stroke="var(--color-accent-bar)" strokeWidth={0.3} opacity={0.6} /> : null}
    </svg>
  );
}
