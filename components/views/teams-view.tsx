'use client';

import NextLink from 'next/link';
import { MUTED, TEAMS, USERS } from '@/lib/constants';
import type { Option } from '@/lib/types';
import { EmptyState, PageHeader, PhotoPlaceholder } from '../common/basics';
import { useShell } from '../shell/shell-context';
import { Input } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Select } from '../ui/select';

export function TeamsView() {
  const { ui, setUi } = useShell();
  const tq = ui.teamQ.trim().toLowerCase(), tf = ui.teamF;
  const match = (u: (typeof USERS)[number]) => !tq || (u.name + ' ' + u.en + ' ' + u.title + ' ' + u.email + ' ' + u.site).toLowerCase().includes(tq);
  const teams = TEAMS.filter(t => tf === 'all' || t.k === tf).map(t => ({ ...t, members: USERS.filter(u => u.team === t.k && match(u)) })).filter(t => t.members.length);
  const filterItems: Option[] = [{ value: 'all', label: 'All teams', icon: 'users', color: MUTED }, ...TEAMS.map(t => ({ value: t.k, label: t.name, sub: USERS.filter(u => u.team === t.k).length + ' people' }))];
  const sites = new Set(USERS.map(u => u.site)).size;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      <PageHeader
        title="Teams"
        sub={`${USERS.length} engineers across ${TEAMS.length} teams in ${sites} sites, Suwon and Bangalore`}
        action={
          <div className="flex flex-wrap gap-3">
            <div className="w-[240px] max-w-full"><Input icon="search" value={ui.teamQ} onChange={v => setUi({ teamQ: v })} placeholder="Search name, title, email" ariaLabel="Search people" /></div>
            <div className="w-[300px] max-w-full"><Select ariaLabel="Team" items={filterItems} value={tf} onValueChange={v => setUi({ teamF: v })} /></div>
          </div>
        }
      />
      {teams.map(t => (
        <section key={t.k} className="flex flex-col gap-7 border-t border-line pt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex flex-col gap-1"><h2 className="text-base font-[650]">{t.name}</h2><span className="text-muted">{t.desc}</span></div>
            <span className="text-sm text-muted">{t.members.length + (t.members.length === 1 ? ' person' : ' people')}</span>
          </div>
          <div className="grid gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr))]">
            {t.members.map(u => (
              <div key={u.id} className="flex items-start gap-5">
                <PhotoPlaceholder w={96} h={120} iconSize={32} title={'Photo placeholder · photos/' + u.id + '.png'} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <NextLink href={'/teams/' + u.id} className="w-max text-base font-[650] text-inherit">{u.name}</NextLink>
                    {u.en !== u.name ? <span className="text-sm text-muted">{u.en}</span> : null}
                  </div>
                  <span>{u.title}</span>
                  <a href={'mailto:' + u.email} className="flex w-max max-w-full items-center gap-1.5 text-sm"><Icon name="mail" size={14} /><span className="truncate">{u.email}</span></a>
                  <p className="mt-1.5 leading-[1.6] text-pretty text-ink-3">{u.intro}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {!teams.length ? <EmptyState icon="users" title="No people match this search" text="Check the spelling, or search by team or role instead." /> : null}
    </div>
  );
}
