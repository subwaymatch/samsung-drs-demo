'use client';

import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { PreviewCard } from '@base-ui/react/preview-card';
import NextLink from 'next/link';
import type { PersonView } from '@/lib/types';
import { Icon } from './icon';

export function Avatar({ person, size = 28 }: { person: Pick<PersonView, 'ini' | 'bg' | 'fg' | 'name'> & { photo?: string }; size?: number }) {
  return (
    <BaseAvatar.Root className="bui-av" title={person.name} style={{ width: size, height: size, color: person.fg, fontSize: Math.round(size * 0.36) }}>
      {person.photo ? <BaseAvatar.Image src={person.photo} alt="" className="h-full w-full object-cover object-[50%_15%]" /> : null}
      <BaseAvatar.Fallback className="grid h-full w-full place-items-center" style={{ background: person.bg }}>{person.ini}</BaseAvatar.Fallback>
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
        render={<NextLink href={person.href} />}
      >
        <Avatar person={person} size={size} />
        {showName ? <span className="bui-trunc font-[550]">{person.name}</span> : null}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner className="bui-positioner" sideOffset={8}>
          <PreviewCard.Popup className="bui-popup bui-pcard">
            <div className="flex items-start gap-3.5">
              <Avatar person={person} size={48} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-[650]">{person.name}</span>
                {person.en && person.en !== person.name ? <span className="bui-item-sub">{person.en}</span> : null}
                <span>{person.title}</span>
                <span className="bui-item-sub">{person.teamName}</span>
              </div>
            </div>
            {person.email ? (
              <a href={'mailto:' + person.email} className="flex min-w-0 items-center gap-2">
                <Icon name="mail" size={14} />
                <span className="bui-trunc">{person.email}</span>
              </a>
            ) : null}
            <NextLink href={person.href} className="flex items-center gap-1.5 border-t border-[oklch(0.94_0.008_290)] pt-3 font-[550]">
              View profile <Icon name="arrow-right" size={14} />
            </NextLink>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

/** Overlapping avatars with a "+N" overflow chip. */
export function PeopleStack({ people, more, moreTip, label }: { people: PersonView[]; more?: string; moreTip?: string; label?: string }) {
  return (
    <div onClick={e => e.stopPropagation()} aria-label={label} className="flex items-center justify-end pl-1.5">
      {people.map(p => (
        <span key={p.id} className="-ml-1.5 flex rounded-full bg-white shadow-[0_0_0_2px_#fff]">
          <Person person={p} size={28} />
        </span>
      ))}
      {more ? (
        <span title={moreTip} className="-ml-1.5 grid h-7 min-w-7 place-items-center rounded-[14px] bg-[oklch(0.95_0.012_290)] px-1.5 text-xs font-semibold text-ink-4 tabular-nums shadow-[0_0_0_2px_#fff]">
          {more}
        </span>
      ) : null}
    </div>
  );
}
