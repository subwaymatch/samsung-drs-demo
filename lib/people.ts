import { ROLE, TM, UM, USERS } from './constants';
import type { Option, PersonView } from './types';

/** Avatar initials: given name for Korean names, initials otherwise. */
export const ini = (n: string) => (/[가-힣]/.test(n) ? n.slice(1) : n.split(' ').map(w => w[0]).join(''));

const views = new Map<string, PersonView>();

/** Display data for a person, cached by id. */
export function av(id: string): PersonView {
  const hit = views.get(id);
  if (hit) return hit;
  const u = UM[id] || { name: 'Unknown', en: 'Unknown', title: '', h: 290, email: '', team: '' };
  const v: PersonView = {
    id,
    name: u.name,
    en: u.en || u.name,
    href: '/teams/' + id,
    title: u.title,
    email: u.email,
    teamName: (TM[u.team] || {}).name || '',
    ini: ini(u.name),
    bg: `oklch(0.94 0.04 ${u.h})`,
    fg: `oklch(0.4 0.12 ${u.h})`
  };
  views.set(id, v);
  return v;
}

/** Name in both scripts when they differ, e.g. "김지현 · Jihyun Kim". */
export const bothNames = (id: string) => {
  const u = UM[id];
  return !u ? 'Unknown' : u.en !== u.name ? `${u.name} · ${u.en}` : u.name;
};

export const personOption = (id: string, sub?: string): Option => {
  const u = UM[id];
  return { value: id, label: u.name, en: u.en, sub: sub ?? u.title, avatar: av(id) };
};

export const userOptions = () =>
  USERS.map(u => personOption(u.id, ROLE[u.role] + ' · ' + TM[u.team].name));
export const engineerOptions = () => USERS.filter(u => u.role === 'eng').map(u => personOption(u.id));
export const reviewerOptions = () => USERS.filter(u => u.role === 'cr').map(u => personOption(u.id));
