'use client';

import NextLink from 'next/link';
import { useState, type ReactNode } from 'react';
import { DEC, RST } from '@/lib/constants';
import { fAt } from '@/lib/dates';
import { av } from '@/lib/people';
import { thumbOf, type ModelInfo, type Spec } from '@/lib/products';
import { parts } from '@/lib/records';
import type { AffChip, RelRow } from '@/lib/relations';
import type { Activity, Attachment, Option, PersonView } from '@/lib/types';
import type { SysRecord } from '@/lib/views';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import { MentionTextarea } from '../ui/fields';
import { Attachments, FileButton } from '../ui/files';
import { Icon } from '../ui/icon';
import { Person } from '../ui/person';
import { RegionMap } from '../ui/region-map';
import { Note, PhotoPlaceholder, StatusLabel, Thumb } from './basics';
import { Clickable } from './clickable';

export const SideLabel = ({ icon, children, right }: { icon: string; children: ReactNode; right?: ReactNode }) => (
  <div className="mb-1.5 flex items-center justify-between gap-2.5">
    <span className="flex items-center gap-2 text-sm font-semibold text-muted">
      <Icon name={icon} size={15} color="var(--color-muted)" />
      {children}
    </span>
    {right ? <span className="text-sm text-muted">{right}</span> : null}
  </div>
);

export function Breadcrumb({ href, label, id }: { href: string; label: string; id: string }) {
  return (
    <div className="flex items-center gap-2.5 text-muted">
      <NextLink href={href} className="bui-btn bui-link"><Icon name="arrow-left" size={16} />{label}</NextLink>
      <span>/</span>
      <span className="font-mono text-sm">{id}</span>
    </div>
  );
}

/** "Reported by" / "Requested by" card with a portrait placeholder. */
export function PersonCard({ label, person, when }: { label: string; person: PersonView; when: string }) {
  return (
    <section className="flex min-w-0 flex-col gap-3.5">
      <span className="text-sm font-semibold text-ink-4">{label}</span>
      <div className="flex items-center gap-4">
        <PhotoPlaceholder w={56} h={70} src={person.photo} title={person.photo ? person.name : 'Photo placeholder'} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <NextLink href={person.href} className="text-[15px] font-[650] text-inherit">{person.name}</NextLink>
            {person.en !== person.name ? <span className="text-sm text-muted">{person.en}</span> : null}
          </div>
          <span>{person.title}, {person.teamName}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
            <a href={'mailto:' + person.email} className="flex items-center gap-1.5"><Icon name="mail" size={14} />{person.email}</a>
            <span>{when}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AffectedProducts({ chips, addItems, sub, onAdd, onRemove }: { chips: AffChip[]; addItems: Option[]; sub: string; onAdd: (v: string) => void; onRemove: (c: AffChip) => void }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-[650]">Affected products</h3>
        <span className="text-sm text-muted">{sub}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map(c => (
          <span
            key={c.key}
            title={c.tip}
            className="inline-flex min-h-[34px] items-center gap-2 rounded-md border pr-2 pl-3"
            style={{ borderColor: c.primary ? 'oklch(0.86 0.06 293)' : 'oklch(0.9 0.012 290)', background: c.primary ? 'oklch(0.96 0.03 293)' : '#fff' }}
          >
            <Icon name={c.icon} size={15} color="oklch(0.5 0.12 293)" />
            <span className="font-[550] whitespace-nowrap">{c.label}</span>
            <span className="text-sm whitespace-nowrap text-muted">{c.sub}</span>
            {c.remove ? (
              <button type="button" title="Remove" onClick={() => onRemove(c)} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-muted hover:text-accent-ink">
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </span>
        ))}
        {addItems.length ? (
          <div className="w-[260px] max-w-full">
            <Combobox items={addItems} value={null} onValueChange={v => v && onAdd(v)} placeholder="Add a product line or model" leadIcon="plus" resetOnSelect />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SpecItem({ s }: { s: Spec }) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span className="text-sm text-muted">{s.k}</span>
      <span className={'font-[550] [overflow-wrap:anywhere] ' + (s.mono ? 'font-mono text-sm' : '')}>
        {s.mono ? s.v.split('/').map((seg, i) => (i ? <span key={i}>/<wbr />{seg}</span> : seg)) : s.v}
      </span>
    </div>
  );
}

export function ProductPanel({ pm }: { pm: ModelInfo }) {
  if (!pm.has) return null;
  const region = pm.eng.find(s => s.region);
  const rest = pm.eng.filter(s => !s.region);
  return (
    <div className="flex flex-wrap items-center gap-6 border-y border-line py-5">
      <Thumb th={thumbOf(pm.id)} w={168} h={120} iconSize={32} label />
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-[650]">Samsung {pm.series} {pm.id}</span>
          <span className="text-muted">{pm.kind}</span>
        </div>
        <div className="grid gap-x-6 gap-y-3 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
          {pm.specs.map(s => (
            <div key={s.k} className="flex min-w-0 flex-col gap-[3px]"><span className="text-sm text-muted">{s.k}</span><span className="font-[550]">{s.v}</span></div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-line-soft pt-3.5">
          <span className="text-sm font-semibold text-ink-4">Engineering</span>
          <div className="flex flex-wrap gap-x-8 gap-y-5">
            {region ? (
              <div className="flex min-w-0 flex-[0_1_220px] flex-col gap-[3px]">
                <span className="text-sm text-muted">{region.k}</span>
                <span className="font-[550]">{region.v}</span>
                <div className="mt-2.5">
                  <RegionMap label={region.v} />
                </div>
              </div>
            ) : null}
            {/* Three columns beside the map; below it when three no longer fit, then two on phones. */}
            <div className="grid min-w-0 flex-[1_1_470px] content-start gap-x-6 gap-y-3 [grid-template-columns:repeat(auto-fit,minmax(max(140px,calc((100%_-_48px)_/_3)),1fr))]">
              {rest.map(s => (
                <SpecItem key={s.k} s={s} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDelete({ id, noun, onCancel, onConfirm }: { id: string; noun: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-l-[3px] border-danger-rule py-3 pl-[18px]" role="alert">
      <span className="flex-[1_1_280px]">Delete <strong>{id}</strong> and its comments and attachments? This can't be undone.</span>
      <div className="flex gap-2.5">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="dangerSolid" icon="trash-2" onClick={onConfirm}>Delete {noun}</Button>
      </div>
    </div>
  );
}

function RecordColumn({ title, items, onOpen }: { title: string; items: SysRecord[]; onOpen: (x: SysRecord) => void }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="border-b border-line pb-2.5 text-sm font-semibold text-ink-5">{title}</span>
      {items.map(x => (
        <div key={x.sys} className="flex min-w-0 flex-col gap-1 border-b border-line-soft py-3.5 last:border-b-0">
          <div className="mb-1.5 flex items-center justify-between gap-2.5">
            <span className="flex flex-wrap items-center gap-2 font-semibold">
              {x.logo ? <span className="h-4 w-7 flex-none bg-contain bg-left bg-no-repeat" style={{ backgroundImage: `url('${x.logo}')` }} /> : null}
              <span>{x.sys}</span>
              {x.master ? <span className="rounded bg-[oklch(0.96_0.03_293)] px-2 py-px text-[13px] font-[550] text-accent-ink">Source of truth</span> : null}
            </span>
            {x.id ? (
              <button type="button" onClick={() => onOpen(x)} className="bui-btn bui-link bui-sm">
                {x.id}
                <Icon name="external-link" size={14} />
              </button>
            ) : null}
          </div>
          <span className="font-[550]" style={{ color: x.fg }}>{x.state}</span>
          <span className="text-sm leading-normal [overflow-wrap:anywhere] text-muted">{x.meta}</span>
        </div>
      ))}
    </div>
  );
}

export function RecordsAcrossSystems({ sub, legacyTitle, legacy, next, synced, onSync, onOpen }: { sub: string; legacyTitle: string; legacy: SysRecord[]; next: SysRecord[]; synced: string; onSync: () => void; onOpen: (x: SysRecord) => void }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <h3 className="text-base font-[650]">Records across systems</h3>
          <span className="text-sm leading-normal text-pretty text-muted">{sub}</span>
        </div>
        <Button variant="ghost" size="sm" icon="refresh-cw" onClick={onSync}>Sync now</Button>
      </div>
      <div className="grid gap-x-8 gap-y-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
        <RecordColumn title={legacyTitle} items={legacy} onOpen={onOpen} />
        <RecordColumn title="New, Perforce and Atlassian" items={next} onOpen={onOpen} />
      </div>
      <span className="text-sm text-muted">{synced}</span>
    </section>
  );
}

export function RelatedSection({ title, sub, linkLabel, linked, sugg, pick, onLink, onUnlink, emptyTitle, emptyText }: {
  title: string; sub: string; linkLabel: string; linked: RelRow[]; sugg: RelRow[]; pick: Option[];
  onLink: (id: string) => void; onUnlink: (id: string) => void; emptyTitle: string; emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const row = (l: RelRow, isLinked: boolean) => (
    <div key={l.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-line-soft py-3 last:border-b-0">
      <Clickable href={l.href} className="row-link flex min-w-0 flex-[1_1_260px] flex-col gap-1">
        <span className="flex min-w-0 items-center gap-3.5">
          <span className="font-mono text-sm whitespace-nowrap text-muted">{l.id}</span>
          <span className="bui-trunc min-w-0 flex-1">{l.title}</span>
        </span>
        {l.meta ? <span className="text-sm text-muted">{l.meta}</span> : null}
      </Clickable>
      <StatusLabel l={l.stL} fg={l.stFg} icon={l.stIcon} />
      <Button variant="ghost" size="sm" icon={isLinked ? 'x' : 'link'} onClick={() => (isLinked ? onUnlink(l.id) : onLink(l.id))}>{isLinked ? 'Unlink' : 'Link'}</Button>
    </div>
  );
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <h3 className="text-base font-[650]">{title}</h3>
          <span className="text-sm leading-normal text-pretty text-muted">{sub}</span>
        </div>
        <Button variant="ghost" size="sm" icon="link" onClick={() => setOpen(o => !o)}>{linkLabel}</Button>
      </div>
      {open ? (
        <div className="flex flex-wrap items-start gap-2.5 pt-1 pb-2">
          <div className="flex-[1_1_260px]">
            <Combobox items={pick} value={null} limit={40} onValueChange={v => { if (v) { onLink(v); setOpen(false); } }} placeholder="Search by ID or title" resetOnSelect />
          </div>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      ) : null}
      <div className="flex flex-col">{linked.map(l => row(l, true))}</div>
      {!linked.length ? <Note icon="link" title={emptyTitle} text={emptyText} /> : null}
      {sugg.length ? (
        <div className="flex flex-col pt-3">
          <span className="pb-1 text-sm font-semibold text-ink-5">Suggested</span>
          {sugg.map(l => row(l, false))}
        </div>
      ) : null}
    </section>
  );
}

/** Text with @mentions highlighted. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parts(text).map((p, i) => (p.mention ? <span key={i} className="font-semibold text-[oklch(0.45_0.19_293)]">{p.t}</span> : <span key={i}>{p.t}</span>))}
    </>
  );
}

export function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <>
      {items.map((a, i) => {
        const who = av(a.u);
        if (a.t === 'e') {
          return (
            <div key={i} className="flex items-center gap-3 pl-1.5 text-muted">
              <Person person={who} size={20} />
              <span><strong className="font-semibold text-ink">{who.name}</strong> {a.x}</span>
              <span className="ml-auto text-sm whitespace-nowrap">{fAt(a.at)}</span>
            </div>
          );
        }
        const isD = a.t === 'd' && a.dec, rs = isD ? RST[a.dec!] : null;
        return (
          <div key={i} className="flex items-start gap-3.5">
            <Person person={who} size={32} />
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1" style={isD && rs ? { borderLeft: '2px solid ' + rs.fg, paddingLeft: 16 } : undefined}>
              <div className="flex flex-wrap items-center gap-2.5">
                <strong className="font-semibold">{who.name}</strong>
                {isD && rs ? <StatusLabel l={DEC[a.dec!]} fg={rs.fg} icon={rs.icon} size={14} weight={600} className="gap-1.5" /> : null}
                <span className="text-sm text-muted">{fAt(a.at)}</span>
                {a.loc ? <span className="flex items-center gap-1.5 font-mono text-sm text-muted"><Icon name="file-code" size={14} />{a.loc}</span> : null}
              </div>
              <div className="leading-[1.7] whitespace-pre-wrap text-pretty"><RichText text={a.x} /></div>
              {a.att && a.att.length ? <Attachments items={a.att} /> : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function Composer({ me, people, onPost }: { me: PersonView; people: Option[]; onPost: (text: string, att: Attachment[]) => void }) {
  const [text, setText] = useState('');
  const [att, setAtt] = useState<Attachment[]>([]);
  const post = () => {
    const t = text.trim();
    if (!t && !att.length) return;
    onPost(t, att);
    setText('');
    setAtt([]);
  };
  return (
    <div className="mt-1 flex items-start gap-3.5">
      <Person person={me} size={32} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <MentionTextarea value={text} onChange={setText} people={people} rows={3} placeholder="Leave a comment. Type @ to mention someone." ariaLabel="Comment" />
        <Attachments items={att} onRemove={i => setAtt(a => a.filter((_, j) => j !== i))} />
        <div className="flex justify-between gap-2.5">
          <FileButton variant="ghost" size="sm" onFiles={list => setAtt(a => [...a, ...list])}>Attach</FileButton>
          <Button variant="primary" icon="send" onClick={post}>Comment</Button>
        </div>
      </div>
    </div>
  );
}

export function Subscribers({ people, count, note }: { people: PersonView[]; count: string; note: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
      <SideLabel icon="bell" right={count}>Subscribers</SideLabel>
      <div className="flex flex-wrap gap-1.5">{people.map(p => <Person key={p.id} person={p} size={28} />)}</div>
      <span className="text-sm leading-normal text-muted">{note}</span>
    </div>
  );
}
