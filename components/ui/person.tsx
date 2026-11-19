import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Link } from 'react-router';
import type { PersonView } from '@/lib/types';
import { Icon } from './icon';
import { langOf } from '@/lib/text';
import { smallPhoto } from '@/lib/people';
import { cx } from '@/lib/cx';
import s from './person.module.css';

export function Avatar({ person, size = 28 }: { person: Pick<PersonView, 'ini' | 'bg' | 'fg' | 'name'> & { photo?: string }; size?: number }) {
  return (
    <BaseAvatar.Root className="bui-av" title={person.name} style={{ width: size, height: size, color: person.fg, fontSize: Math.round(size * 0.36) }}>
      {person.photo ? <BaseAvatar.Image src={smallPhoto(person.photo)} alt="" className={s.avatarImg} /> : null}
      <BaseAvatar.Fallback className={s.avatarFallback} style={{ background: person.bg }}>{person.ini}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

/** Avatar that links to the profile and shows a preview card on hover. */
export function Person({ person, size = 28, showName }: { person: PersonView; size?: number; showName?: boolean }) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={350}
        className="bui-person"
        aria-label={person.name}
        onClick={e => e.stopPropagation()}
        render={<Link to={person.href} />}
      >
        <Avatar person={person} size={size} />
        {showName ? <span lang={langOf(person.name)} className={cx('bui-trunc', s.name)}>{person.name}</span> : null}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner className="bui-positioner" sideOffset={8}>
          <PreviewCard.Popup className="bui-popup bui-pcard">
            <div className={s.cardHead}>
              <Avatar person={person} size={48} />
              <div className={s.cardText}>
                <span lang={langOf(person.name)} className={s.cardName}>{person.name}</span>
                {person.en && person.en !== person.name ? <span className="bui-item-sub">{person.en}</span> : null}
                <span>{person.title}</span>
                <span className="bui-item-sub">{person.teamName}</span>
              </div>
            </div>
            {person.email ? (
              <a href={'mailto:' + person.email} className={s.cardEmail}>
                <Icon name="mail" size={14} />
                <span className="bui-trunc">{person.email}</span>
              </a>
            ) : null}
            <Link to={person.href} className={s.cardProfile}>
              View profile <Icon name="arrow-right" size={14} />
            </Link>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

/** Overlapping avatars with a "+N" overflow chip. */
export function PeopleStack({ people, more, moreTip, label }: { people: PersonView[]; more?: string; moreTip?: string; label?: string }) {
  return (
    <div onClick={e => e.stopPropagation()} role="group" aria-label={label} title={label} className={s.stack}>
      {people.map(p => (
        <span key={p.id} className={s.stackItem}>
          <Person person={p} size={28} />
        </span>
      ))}
      {more ? (
        <span title={moreTip} className={s.stackMore}>
          {more}
        </span>
      ) : null}
    </div>
  );
}
