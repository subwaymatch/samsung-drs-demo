'use client';

// Client-side store. The mock data is generated deterministically in the
// browser, and only the viewer's edits are saved to localStorage. On the server
// the snapshot is null, so pages render a lightweight shell and the Worker never
// generates data.

import { useSyncExternalStore } from 'react';
import { DEF_SUM, type SummarySettings } from './digest';
import type { ReadState, Subs } from './notifications';
import { SEED_VERSION, seed } from './seed/generate';
import type { Attachment, Data, Defect, Review } from './types';

const EDITS_KEY = 'drs-edits-v1';
const PREFS_KEY = 'drs-prefs-v1';

interface Edits {
  v: number;
  d: Record<string, Defect>;
  r: Record<string, Review>;
  dd: string[];
  dr: string[];
}
export interface Prefs {
  meId: string;
  diff: 'sbs' | 'uni';
  subs: Subs;
  read: Record<string, Partial<ReadState>>;
  sum: Record<string, Partial<SummarySettings>>;
}
export interface AppState {
  data: Data;
  prefs: Prefs;
}

const emptyEdits = (): Edits => ({ v: SEED_VERSION, d: {}, r: {}, dd: [], dr: [] });
const DEFAULT_PREFS: Prefs = { meId: 'u1', diff: 'sbs', subs: {}, read: {}, sum: {} };

const readJSON = <T,>(key: string): T | null => {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
};
const writeJSON = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // Storage full or blocked: edits still apply for this session.
  }
};

/** Blob URLs do not survive a reload, so keep only the file details. */
const stripTemp = (list: Attachment[] = []) => list.map(a => (a.temp ? { name: a.name, size: a.size, type: a.type } : a));
const persistable = <T extends Defect | Review>(o: T): T => ({
  ...o,
  attachments: stripTemp(o.attachments),
  activity: o.activity.map(a => ({ ...a, att: stripTemp(a.att) }))
});

let edits: Edits = emptyEdits();
let state: AppState | null = null;
const listeners = new Set<() => void>();

function applyEdits(base: Data, e: Edits): Data {
  const dIds = new Set(base.defects.map(d => d.id)), rIds = new Set(base.reviews.map(r => r.id));
  const dd = new Set(e.dd), dr = new Set(e.dr);
  const newD = Object.values(e.d).filter(d => !dIds.has(d.id) && !dd.has(d.id)).sort((a, b) => (a.created < b.created ? 1 : -1));
  const newR = Object.values(e.r).filter(r => !rIds.has(r.id) && !dr.has(r.id)).sort((a, b) => (a.submitted < b.submitted ? 1 : -1));
  return {
    defects: [...newD, ...base.defects.filter(d => !dd.has(d.id)).map(d => e.d[d.id] || d)],
    reviews: [...newR, ...base.reviews.filter(r => !dr.has(r.id)).map(r => e.r[r.id] || r)]
  };
}

function init(): AppState {
  const stored = readJSON<Edits>(EDITS_KEY);
  edits = stored && stored.v === SEED_VERSION ? { ...emptyEdits(), ...stored } : emptyEdits();
  const prefs = { ...DEFAULT_PREFS, ...(readJSON<Partial<Prefs>>(PREFS_KEY) || {}) };
  return { data: applyEdits(seed(), edits), prefs };
}

const getSnapshot = () => state ?? (state = init());
const getServerSnapshot = () => null;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const emit = () => listeners.forEach(l => l());

/** The app state, or null while rendering on the server and during hydration. */
export function useApp(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const setData = (data: Data) => {
  state = { ...getSnapshot(), data };
  writeJSON(EDITS_KEY, edits);
  emit();
};
export const setPrefs = (patch: Partial<Prefs>) => {
  const prefs = { ...getSnapshot().prefs, ...patch };
  state = { ...getSnapshot(), prefs };
  writeJSON(PREFS_KEY, prefs);
  emit();
};

// ---- Data actions ----

export function updDefect(id: string, fn: (d: Defect) => Defect) {
  const data = getSnapshot().data;
  setData({
    ...data,
    defects: data.defects.map(d => {
      if (d.id !== id) return d;
      const next = fn({ ...d, activity: [...d.activity] });
      edits.d[id] = persistable(next);
      return next;
    })
  });
}
export function updDefects(ids: Set<string>, fn: (d: Defect) => Defect) {
  const data = getSnapshot().data;
  setData({
    ...data,
    defects: data.defects.map(d => {
      if (!ids.has(d.id)) return d;
      // fn must not mutate d; returning d unchanged skips the record.
      const next = fn(d);
      if (next !== d) edits.d[d.id] = persistable(next);
      return next;
    })
  });
}
export function updReview(id: string, fn: (r: Review) => Review) {
  const data = getSnapshot().data;
  setData({
    ...data,
    reviews: data.reviews.map(r => {
      if (r.id !== id) return r;
      const next = fn({ ...r, activity: [...r.activity], reviewers: [...(r.reviewers || [])] });
      edits.r[id] = persistable(next);
      return next;
    })
  });
}
export function addDefect(d: Defect) {
  const data = getSnapshot().data;
  edits.d[d.id] = persistable(d);
  setData({ ...data, defects: [d, ...data.defects] });
}
export function addReview(r: Review) {
  const data = getSnapshot().data;
  edits.r[r.id] = persistable(r);
  setData({ ...data, reviews: [r, ...data.reviews] });
}
export function deleteDefect(id: string) {
  const data = getSnapshot().data;
  delete edits.d[id];
  edits.dd = [...edits.dd, id];
  setData({ ...data, defects: data.defects.filter(d => d.id !== id) });
}
export function deleteReview(id: string) {
  const data = getSnapshot().data;
  delete edits.r[id];
  edits.dr = [...edits.dr, id];
  setData({ ...data, reviews: data.reviews.filter(r => r.id !== id) });
}
export function resetDemo() {
  edits = emptyEdits();
  try {
    localStorage.removeItem(EDITS_KEY);
  } catch {
    // ignore
  }
  setData(seed());
}

// ---- Preferences ----

export const getPrefs = () => getSnapshot().prefs;
export const summaryOf = (prefs: Prefs, me: string): SummarySettings => {
  const u = prefs.sum[me] || {};
  return { ...DEF_SUM, ...u, content: { ...DEF_SUM.content, ...(u.content || {}) } };
};
export function setSummary(me: string, patch: Partial<SummarySettings>) {
  const prefs = getPrefs();
  setPrefs({ sum: { ...prefs.sum, [me]: { ...summaryOf(prefs, me), ...patch } } });
}
export function setSubscribed(id: string, u: string, v: boolean) {
  const subs = getPrefs().subs, cur = subs[u] || {};
  const x = { on: (cur.on || []).filter(i => i !== id), off: (cur.off || []).filter(i => i !== id) };
  (v ? x.on : x.off).push(id);
  setPrefs({ subs: { ...subs, [u]: x } });
}
export function setRead(u: string, patch: Partial<ReadState>) {
  const read = getPrefs().read;
  setPrefs({ read: { ...read, [u]: { ...(read[u] || {}), ...patch } } });
}
