import { RST, UM } from './constants';
import { autoSub } from './records';
import type { Data, Defect, Review } from './types';

export interface Notif {
  id: string;
  kind: 'assign' | 'mention' | 'comment' | 'status' | 'decision';
  at: string;
  u: string;
  verb: string;
  icon: string;
  itemId: string;
  title: string;
  href: string;
  text: string;
}

export type Subs = Record<string, { on?: string[]; off?: string[] }>;

/** Explicit subscribe or unsubscribe wins; otherwise people involved are subscribed. */
export const isSubscribed = (subs: Subs, o: Defect | Review, u: string) => {
  const x = subs[u] || {};
  if ((x.on || []).includes(o.id)) return true;
  if ((x.off || []).includes(o.id)) return false;
  return autoSub(o, u);
};

/** Everything that happened to me or on items I follow, newest first. */
export function buildNotifs(data: Data, me: string, subs: Subs): Notif[] {
  const nm = (UM[me] || { name: '' }).name;
  const out: Notif[] = [];
  const push = (o: Defect | Review, isD: boolean, kind: Notif['kind'], a: { at: string; u: string; t: string; x: string }, i: number, verb: string, icon: string) =>
    out.push({ id: o.id + '|' + i, kind, at: a.at, u: a.u, verb, icon, itemId: o.id, title: o.title, href: (isD ? '/defects/' : '/reviews/') + o.id, text: a.t !== 'e' ? a.x : '' });
  data.defects.forEach(d => {
    const sub = isSubscribed(subs, d, me);
    d.activity.forEach((a, i) => {
      if (a.u === me) return;
      if (a.t === 'e' && a.x === 'assigned ' + nm) return push(d, true, 'assign', a, i, 'assigned you to', 'user-check');
      if (a.t === 'c' && (a.x || '').includes('@' + nm)) return push(d, true, 'mention', a, i, 'mentioned you on', 'at-sign');
      if (!sub) return;
      if (a.t === 'c') return push(d, true, 'comment', a, i, 'commented on', 'message-square');
      if (a.t === 'e' && /^changed status to /.test(a.x))
        return push(d, true, 'status', a, i, a.x.endsWith('Resolved') ? 'resolved' : a.x.endsWith('Closed') ? 'closed' : 'changed the status of', /(Resolved|Closed)$/.test(a.x) ? 'circle-check' : 'circle-dot');
    });
  });
  data.reviews.forEach(r => {
    const sub = isSubscribed(subs, r, me);
    r.activity.forEach((a, i) => {
      if (a.u === me) return;
      if (a.t === 'e' && a.x === 'assigned ' + nm + ' as reviewer') return push(r, false, 'assign', a, i, 'added you as a reviewer on', 'user-plus');
      if (a.t !== 'e' && (a.x || '').includes('@' + nm)) return push(r, false, 'mention', a, i, 'mentioned you on', 'at-sign');
      if (!sub) return;
      if (a.t === 'd' && a.dec) return push(r, false, 'decision', a, i, { approved: 'approved', changes: 'requested modification on', denied: 'denied' }[a.dec], RST[a.dec].icon);
      if (a.t === 'c') return push(r, false, 'comment', a, i, 'commented on', 'message-square');
    });
  });
  out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return out.slice(0, 300);
}

export interface ReadState { all: string; ids: string[] }
/** Until the viewer marks things read, everything from the last week is unread. */
export const DEFAULT_READ_ALL = '2017-09-08 00:00';
export const readOf = (all: Record<string, Partial<ReadState>>, me: string): ReadState => {
  const r = all[me] || {};
  return { all: r.all || DEFAULT_READ_ALL, ids: r.ids || [] };
};
export const isUnread = (n: Notif, rd: ReadState) => n.at > rd.all && !rd.ids.includes(n.id);
