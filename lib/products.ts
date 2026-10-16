import { MM, MODELS, MUTED } from './constants';
import type { Affects, Data, Defect, Option, Review } from './types';

const PLAT: Record<string, string> = { Xpress: 'RTOS (ThreadX)', ProXpress: 'XOA embedded (Linux 3.x)', MultiXpress: 'Smart UX (Android 4.4)' };

/** Product line, e.g. "ProXpress Color" or "MultiXpress Mono A3". Models in a line share a firmware base. */
export const LINE_OF = (id: string) => {
  const x = MM[id];
  if (!x) return 'Other';
  return x.series + (/Color/.test(x.kind) ? ' Color' : ' Mono') + (x.series === 'MultiXpress' ? ' A3' : '');
};
export const LINES = [...new Set(MODELS.map(m => LINE_OF(m.id)))];
export const LINFO: Record<string, { models: string[]; plat: string }> = Object.fromEntries(
  LINES.map(l => {
    const ms = MODELS.filter(m => LINE_OF(m.id) === l);
    return [l, { models: ms.map(m => m.id), plat: PLAT[ms[0].series] }];
  })
);

export interface Thumb {
  id: string;
  photo: string;
  hint: string;
}
/** Generated stand-in photo for a model, at public/products/<model id>.webp. Empty for unknown models. */
export const productPhoto = (id: string) => (MM[id] ? '/products/' + id.toLowerCase() + '.webp' : '');
/** Product photos are generated stand-ins in this demo. */
export const thumbOf = (id: string): Thumb => ({ id, photo: productPhoto(id), hint: id ? 'Product image, ' + id : 'Product image' });

/** The model a review is about: its linked defect's model, or one named in its title or branch. */
export const rModelId = (r: Review, D: Defect[]) => {
  const ld = r.linked ? D.find(x => x.id === r.linked) : undefined;
  const mid = ld ? ld.model : (r.title.match(/SL-[A-Z]\d+[A-Z]*/) || r.branch.match(/[a-z]\d{4}[a-z]*/i) || [''])[0];
  return MM[mid] ? mid : MM['SL-' + String(mid).toUpperCase()] ? 'SL-' + String(mid).toUpperCase() : '';
};

export interface Spec {
  k: string;
  v: string;
  mono?: boolean;
  /** Sales regions, shown with a map. */
  region?: boolean;
}
export interface ModelInfo {
  has: boolean;
  id: string;
  series: string;
  kind: string;
  specs: Spec[];
  eng: Spec[];
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function modelInfo(id: string, fw?: string): ModelInfo {
  const m = MM[id];
  if (!m) return { has: false, id: '', series: '', kind: '', specs: [], eng: [] };
  const a3 = /A3/.test(m.kind), color = /Color/.test(m.kind), mfp = /MFP|copier/.test(m.kind);
  const num = +(id.match(/\d+/) || [0])[0];
  const ppm = a3
    ? Math.max(20, Math.round(num / 100) * (color ? 5 : 6) + (num % 100 === 0 ? 0 : 5))
    : Math.max(18, Math.min(45, Math.round(num / 100) + (color ? 0 : 10)));
  const fn = mfp ? (/F/.test(id.slice(-3)) || a3 ? 'Print, Copy, Scan, Fax' : 'Print, Copy, Scan') : 'Print';
  const conn = /W$/.test(id) ? 'USB, Ethernet, Wi-Fi' : 'USB, Ethernet';
  const h = hash(id);
  const regions =
    m.series === 'Xpress' ? ['Global', 'Korea, China, SEA', 'Americas, Europe']
      : m.series === 'ProXpress' ? ['Global', 'Americas, Europe, Korea', 'Europe, CIS, MEA']
        : ['Korea, Europe, Americas', 'Global (A3 channel)', 'Korea, Japan, Europe'];
  const soc = m.series === 'MultiXpress' ? 'Samsung Exynos-based, 1.5 GHz quad' : m.series === 'ProXpress' ? 'ARM Cortex-A9, 1 GHz dual' : 'ARM9, 600 MHz';
  const mem = m.series === 'MultiXpress' ? '4 GB, 320 GB HDD' : m.series === 'ProXpress' ? (mfp ? '512 MB, 4 GB eMMC' : '512 MB') : '128 MB';
  const pdl = m.series === 'Xpress' ? 'SPL, PCL6' : 'PCL5e/6, PostScript 3, PDF';
  const year = +m.launch.slice(0, 4);
  const fleet = (m.series === 'Xpress' ? 120 : m.series === 'ProXpress' ? 45 : 12) * (1 + (h % 5)) * (year >= 2017 ? 0.2 : year === 2016 ? 0.6 : 1);
  const support = year >= 2016 ? 'Active development' : year === 2015 ? 'Active (fixes and features)' : 'Maintenance (fixes only)';
  const branch = '//depot/printing/fw/' + id.replace('SL-', '').toLowerCase().replace(/[a-z]+$/, '');
  return {
    has: true,
    id,
    series: m.series,
    kind: m.kind,
    specs: [
      { k: 'Paper size', v: a3 ? 'Up to A3' : 'Up to A4 / Legal' },
      { k: 'Output', v: color ? 'Color' : 'Monochrome' },
      { k: 'Speed', v: ppm + ' ppm' },
      { k: 'Functions', v: fn },
      { k: 'Connectivity', v: conn },
      ...(fw ? [{ k: 'Firmware', v: fw }] : [])
    ],
    // Shown as three rows of three beside the sales region map: lifecycle,
    // hardware, then print engine and firmware.
    eng: [
      { k: 'Sales region', v: regions[h % 3], region: true },
      { k: 'Launched', v: m.launch.slice(5) + ' ' + m.launch.slice(0, 4) },
      { k: 'Support status', v: support },
      { k: 'Units in field', v: year >= 2017 && fleet < 5 ? 'Pre-launch / ramp-up' : '~' + Math.round(fleet) + 'K' },
      { k: 'Platform', v: PLAT[m.series] },
      { k: 'Controller', v: soc },
      { k: 'Memory', v: mem },
      { k: 'Engine', v: (color ? 'Tandem color laser' : 'Mono laser') + ', ' + (a3 ? 'Duty 150K' : 'Duty ' + (m.series === 'Xpress' ? '10K' : '80K')) },
      { k: 'Emulations', v: pdl },
      { k: 'Firmware branch', v: branch, mono: true }
    ]
  };
}

// Affected products. A defect is reported on one model and can also affect
// whole product lines (shared firmware) or individual sibling models.

const AFF_COMPS = ['SyncThru Web UI', 'Network / Wi-Fi', 'Print Driver', 'Power / Sleep', 'Panel UI', 'Security', 'Mobile Print'];

export const seqOf = (id: string) => {
  const m = /^D-(\d\d)-(\d+)$/.exec(id);
  if (m) return (+m[1] - 16) * 1000 + +m[2];
  return +String(id).replace(/\D/g, '').slice(-4) || 0;
};

const affSeed = (id: string, model: string, comp: string): Affects => {
  const n = seqOf(id), li = LINFO[LINE_OF(model)];
  if (!li) return { lines: [], models: [] };
  if (AFF_COMPS.includes(comp) && n % 3 === 0) return { lines: [LINE_OF(model)], models: [] };
  const sib = li.models.filter(m => m !== model);
  if (n % 4 === 1 && sib.length) {
    const k = n % sib.length;
    return { lines: [], models: sib.slice(k, k + 1 + (n % 2)) };
  }
  return { lines: [], models: [] };
};

export const affOf = (x: Defect): Affects => x.affects || affSeed(x.id, x.model, x.comp);

const affCache = new WeakMap<Defect, string[]>();
export const affModels = (x: Defect) => {
  let v = affCache.get(x);
  if (!v) {
    const a = affOf(x);
    v = [...new Set([x.model, ...a.models, ...a.lines.flatMap(l => (LINFO[l] ? LINFO[l].models : []))].filter(Boolean))];
    affCache.set(x, v);
  }
  return v;
};
export const affLines = (x: Defect) => [...new Set(affModels(x).map(LINE_OF))];
/** Short label for lists: "SL-C480FW +2" or "ProXpress Color line". */
export const affLabel = (x: Defect) => {
  const a = affOf(x), k = affModels(x).length - 1;
  return a.lines.length ? a.lines.join(', ') + ' line' + (a.lines.length > 1 ? 's' : '') : k > 0 ? `${x.model} +${k}` : x.model;
};
export const affToVals = (a: Affects) => [...a.lines.map(l => 'line:' + l), ...a.models];
export const affFromVals = (vs: string[] | null | undefined, model: string | null): Affects => ({
  lines: (vs || []).filter(v => String(v).startsWith('line:')).map(v => v.slice(5)),
  models: (vs || []).filter(v => !String(v).startsWith('line:') && v !== model)
});

export const modelOptions = (): Option[] => MODELS.map(m => ({ value: m.id, label: m.id, sub: `${m.series}, ${m.kind}`, icon: 'printer', color: MUTED }));
export const lineOptions = (): Option[] =>
  LINES.map(l => ({ value: 'line:' + l, label: l + ' line', sub: `${LINFO[l].models.length} models, ${LINFO[l].plat}`, icon: 'layers', color: 'oklch(0.5 0.12 293)' }));

export const modelOfReview = (r: Review, data: Data) => rModelId(r, data.defects);
