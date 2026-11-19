import { Link } from 'react-router';
import { MUTED, TEAMS, USERS } from '@/lib/constants';
import type { Option } from '@/lib/types';
import { EmptyState, PageHeader, PhotoPlaceholder } from '../common/basics';
import { useShell } from '../shell/shell-context';
import { Input } from '../ui/fields';
import { Icon } from '../ui/icon';
import { Select } from '../ui/select';
import { langOf } from '@/lib/text';
import s from './teams-view.module.css';

export function TeamsView() {
  const { ui, setUi } = useShell();
  const tq = ui.teamQ.trim().toLowerCase(), tf = ui.teamF;
  const match = (u: (typeof USERS)[number]) => !tq || (u.name + ' ' + u.en + ' ' + u.title + ' ' + u.email + ' ' + u.site).toLowerCase().includes(tq);
  const teams = TEAMS.filter(t => tf === 'all' || t.k === tf).map(t => ({ ...t, members: USERS.filter(u => u.team === t.k && match(u)) })).filter(t => t.members.length);
  const filterItems: Option[] = [{ value: 'all', label: 'All teams', icon: 'users', color: MUTED }, ...TEAMS.map(t => ({ value: t.k, label: t.name, sub: USERS.filter(u => u.team === t.k).length + ' people' }))];
  const sites = new Set(USERS.map(u => u.site)).size;

  return (
    <div className={s.page}>
      <PageHeader
        title="Teams"
        sub={`${USERS.length} engineers across ${TEAMS.length} teams in ${sites} sites, Suwon and Bangalore`}
        action={
          <div className={s.filters}>
            <div className={s.search}><Input icon="search" value={ui.teamQ} onChange={v => setUi({ teamQ: v })} placeholder="Search name, title, email" ariaLabel="Search people" /></div>
            <div className={s.teamSelect}><Select ariaLabel="Team" items={filterItems} value={tf} onValueChange={v => setUi({ teamF: v })} /></div>
          </div>
        }
      />
      {teams.map(t => (
        <section key={t.k} className={s.team}>
          <div className={s.teamHead}>
            <div className={s.teamHeading}><h2 className={s.teamName}>{t.name}</h2><span className={s.teamDesc}>{t.desc}</span></div>
            <span className={s.teamCount}>{t.members.length + (t.members.length === 1 ? ' person' : ' people')}</span>
          </div>
          <div className={s.members}>
            {t.members.map(u => (
              <div key={u.id} className={s.member}>
                <PhotoPlaceholder w={96} h={120} iconSize={32} src={u.photo} title={u.photo ? u.name : 'Photo placeholder, photos/' + u.id + '.png'} />
                <div className={s.memberInfo}>
                  <div className={s.memberNames}>
                    <Link to={'/teams/' + u.id} lang={langOf(u.name)} className={s.memberName}>{u.name}</Link>
                    {u.en !== u.name ? <span className={s.memberEn}>{u.en}</span> : null}
                  </div>
                  <span>{u.title}</span>
                  <a href={'mailto:' + u.email} className={s.memberEmail}><Icon name="mail" size={14} /><span className={s.memberEmailText}>{u.email}</span></a>
                  <p className={s.memberIntro}>{u.intro}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {!teams.length ? <EmptyState icon="users" title="No people match this search" text="Check the spelling, or search by team or role instead" /> : null}
    </div>
  );
}
