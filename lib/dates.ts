// Timestamps are stored as local "YYYY-MM-DD HH:MM" strings so they sort as text.

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** First day of recorded history (a Monday). */
export const D0 = '2016-01-04';
/** The demo's "today": a Friday in September 2017. */
export const TODAY = '2017-09-15';
/** Exclusive end of the reporting window (the day after TODAY). */
export const END = '2017-09-16';
/** Reference time used for severity target checks in Insights. */
export const TNOW = TODAY + ' 18:00';

export const pad = (n: number) => String(n).padStart(2, '0');
export const pd = (s: string) => new Date(s.replace(' ', 'T') + ':00');
export const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const fmt = (d: Date) => ymd(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
export const dOf = (k: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
export const addD = (k: string, n: number) => {
  const d = dOf(k);
  d.setDate(d.getDate() + n);
  return ymd(d);
};

export const fDay = (s: string) => {
  const d = pd(s);
  return MON[d.getMonth()] + ' ' + d.getDate();
};
/** "Sep 14, 2017" */
export const fFull = (s: string) => fDay(s) + ', ' + pd(s).getFullYear();
/** "Sep 14, 10:02", or "Sep 14, 2016, 10:02" outside the current year. */
export const fAt = (s: string) => fDay(s) + (s.slice(0, 4) !== TODAY.slice(0, 4) ? ', ' + s.slice(0, 4) : '') + ', ' + s.slice(11, 16);
/** "Sep 14", or "Sep 14, 2016" outside the current year. */
export const fDate = (s: string) => fDay(s) + (s.slice(0, 4) !== TODAY.slice(0, 4) ? ', ' + s.slice(0, 4) : '');
export const hrs = (a: string, b: string) => (pd(b).getTime() - pd(a).getTime()) / 36e5;

/** "Fri, Sep 15" */
export const lbl = (k: string) => {
  const d = dOf(k);
  return WD[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate();
};
/** "Sep 15" */
export const short = (k: string) => {
  const d = dOf(k);
  return MON[d.getMonth()] + ' ' + d.getDate();
};
/** "Sep 15, 2017" when the year differs from the reference year, else "Sep 15". */
export const shortY = (k: string, ref = TODAY) => short(k) + (k.slice(0, 4) !== ref.slice(0, 4) ? ', ' + k.slice(0, 4) : '');

export const dayIdx = (k: string) => Math.round((dOf(k.slice(0, 10)).getTime() - dOf(D0).getTime()) / 864e5);
/** Day index of END: the right edge of every Insights chart. */
export const ED = dayIdx(END);

/** The demo clock: TODAY at the viewer's current time of day. */
export const nowStr = () => {
  const d = new Date();
  return TODAY + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
};

export const byAt = <T extends { at: string }>(a: T, b: T) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);

export const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Compact duration: "35m", "7.4h", "3.2 days". */
export const fDur = (h: number) =>
  h < 1 ? Math.max(1, Math.round(h * 60)) + 'm' : h < 48 ? Math.round(h * 10) / 10 + 'h' : Math.round(h / 2.4) / 10 + ' days';

/** Korean public holidays and company-wide shutdown days in the recorded period. */
export const HOLIDAYS = new Set([
  '2016-02-08', '2016-02-09', '2016-02-10', '2016-03-01', '2016-04-13', '2016-05-05', '2016-05-06', '2016-06-06',
  '2016-08-15', '2016-09-14', '2016-09-15', '2016-09-16', '2016-10-03', '2016-10-09', '2016-12-26', '2016-12-30',
  '2017-01-27', '2017-01-30', '2017-03-01', '2017-05-01', '2017-05-03', '2017-05-05', '2017-05-09', '2017-06-06',
  '2017-08-15'
]);

export const isWorkday = (k: string) => {
  const w = dOf(k).getDay();
  return w > 0 && w < 6 && !HOLIDAYS.has(k);
};

/** Every weekday from the first digest to TODAY: one daily email each. */
export const DAILY: string[] = [];
/** Every Monday from the second week on: one weekly email each. */
export const WEEKLY: string[] = [];
for (let d = dOf('2016-01-05'); ymd(d) <= TODAY; d.setDate(d.getDate() + 1)) {
  const w = d.getDay();
  if (w > 0 && w < 6) DAILY.push(ymd(d));
  if (w === 1 && ymd(d) >= '2016-01-11') WEEKLY.push(ymd(d));
}
