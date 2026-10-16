/** "1 defect", "3 defects", "1 person", "2 people". */
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** "A", "A and B", "A, B and C". */
export const listJoin = (xs: string[]) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

/** "ko" for text with Hangul, so screen readers switch to a Korean voice; undefined otherwise. */
export const langOf = (s: string | undefined) => (s && /[가-힣]/.test(s) ? 'ko' : undefined);

/** An activity event as read by others: "assigned 정민아 as reviewer" by 정민아 becomes "assigned themselves as reviewer". */
export const eventText = (x: string, actorName: string) =>
  x.replace(/^(assigned|unassigned) (.+?)( as reviewer)?$/, (m, verb: string, who: string, rest = '') => (who === actorName ? `${verb} themselves${rest}` : m));
