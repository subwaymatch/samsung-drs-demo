import { Link } from 'react-router';
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
import { eventText, langOf } from '@/lib/text';
import { cx } from '@/lib/cx';
import s from './detail.module.css';

export const SideLabel = ({ icon, children, right }: { icon: string; children: ReactNode; right?: ReactNode }) => (
  <div className={s.labelRow}>
    <span className={s.sideLabel}>
      <Icon name={icon} size={15} color="var(--color-muted)" />
      {children}
    </span>
    {right ? <span className={s.meta}>{right}</span> : null}
  </div>
);

export function Breadcrumb({ href, label, id }: { href: string; label: string; id: string }) {
  return (
    <div className={s.breadcrumb}>
      <Link to={href} className="bui-btn bui-link"><Icon name="arrow-left" size={16} />{label}</Link>
      <span>/</span>
      <span className={s.crumbId}>{id}</span>
    </div>
  );
}

/** "Reported by" / "Requested by" card with a portrait placeholder. */
export function PersonCard({ label, person, when }: { label: string; person: PersonView; when: string }) {
  return (
    <section className={s.personCard}>
      <span className={s.label}>{label}</span>
      <div className={s.personRow}>
        <PhotoPlaceholder w={56} h={70} src={person.photo} title={person.photo ? person.name : 'Photo placeholder'} />
        <div className={s.personInfo}>
          <div className={s.nameLine}>
            <Link to={person.href} lang={langOf(person.name)} className={s.personName}>{person.name}</Link>
            {person.en !== person.name ? <span className={s.meta}>{person.en}</span> : null}
          </div>
          <span>{person.title}, {person.teamName}</span>
          <div className={s.contact}>
            <a href={'mailto:' + person.email} className={s.email}><Icon name="mail" size={14} />{person.email}</a>
            <span>{when}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AffectedProducts({ chips, addItems, sub, onAdd, onRemove }: { chips: AffChip[]; addItems: Option[]; sub: string; onAdd: (v: string) => void; onRemove: (c: AffChip) => void }) {
  return (
    <section className={s.affected}>
      <div className={s.heading}>
        <h2 className={s.label}>Affected products</h2>
        <span className={s.meta}>{sub}</span>
      </div>
      <div className={s.chips}>
        {chips.map(c => (
          <span
            key={c.key}
            title={c.tip}
            className={s.chip}
            style={{ borderColor: c.primary ? 'oklch(0.86 0.06 293)' : 'oklch(0.9 0.012 290)', background: c.primary ? 'oklch(0.96 0.03 293)' : '#fff' }}
          >
            <Icon name={c.icon} size={15} color="oklch(0.5 0.12 293)" />
            <span className={s.chipLabel}>{c.label}</span>
            <span className={s.chipSub}>{c.sub}</span>
            {c.remove ? (
              <button type="button" title="Remove" onClick={() => onRemove(c)} className={s.chipRemove}>
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </span>
        ))}
        {addItems.length ? (
          <div className={s.addProduct}>
            <Combobox items={addItems} value={null} onValueChange={v => v && onAdd(v)} placeholder="Add a product line or model" leadIcon="plus" resetOnSelect />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SpecItem({ spec }: { spec: Spec }) {
  return (
    <div className={s.spec}>
      <span className={s.meta}>{spec.k}</span>
      <span className={cx(s.specValue, spec.mono && s.specValueMono)}>
        {spec.mono ? spec.v.split('/').map((seg, i) => (i ? <span key={i}>/<wbr />{seg}</span> : seg)) : spec.v}
      </span>
    </div>
  );
}

export function ProductPanel({ pm }: { pm: ModelInfo }) {
  if (!pm.has) return null;
  const region = pm.eng.find(x => x.region);
  const rest = pm.eng.filter(x => !x.region);
  return (
    <div className={s.product}>
      <Thumb th={thumbOf(pm.id)} w={168} h={120} iconSize={32} label />
      <div className={s.productMain}>
        <div className={s.productHead}>
          <span className={s.productName}>Samsung {pm.series} {pm.id}</span>
          <span className={s.productKind}>{pm.kind}</span>
        </div>
        <div className={s.specs}>
          {pm.specs.map(x => (
            <div key={x.k} className={s.spec}><span className={s.meta}>{x.k}</span><span className={s.value}>{x.v}</span></div>
          ))}
        </div>
        <div className={s.engineering}>
          <span className={s.label}>Engineering</span>
          <div className={s.engineeringRow}>
            {region ? (
              <div className={s.region}>
                <span className={s.meta}>{region.k}</span>
                <span className={s.value}>{region.v}</span>
                <div className={s.regionMap}>
                  <RegionMap label={region.v} />
                </div>
              </div>
            ) : null}
            {/* Three columns beside the map; below it when three no longer fit, then two on phones. */}
            <div className={s.engineeringSpecs}>
              {rest.map(x => (
                <SpecItem key={x.k} spec={x} />
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
    <div className={s.confirm} role="alert">
      <span className={s.confirmText}>Delete <strong>{id}</strong> and its comments and attachments? This can't be undone.</span>
      <div className={s.confirmActions}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="dangerSolid" icon="trash-2" onClick={onConfirm}>Delete {noun}</Button>
      </div>
    </div>
  );
}

function RecordColumn({ title, items, onOpen }: { title: string; items: SysRecord[]; onOpen: (x: SysRecord) => void }) {
  return (
    <div className={s.recordColumn}>
      <span className={s.recordColumnTitle}>{title}</span>
      {items.map(x => (
        <div key={x.sys} className={s.record}>
          <div className={s.labelRow}>
            <span className={s.recordSystem}>
              {x.logo ? <span className={s.recordLogo} style={{ backgroundImage: `url('${x.logo}')` }} /> : null}
              <span>{x.sys}</span>
              {x.master ? <span className={s.masterBadge}>Source of truth</span> : null}
            </span>
            {x.id ? (
              <button type="button" onClick={() => onOpen(x)} className="bui-btn bui-link bui-sm">
                {x.id}
                <Icon name="external-link" size={14} />
              </button>
            ) : null}
          </div>
          <span className={s.value} style={{ color: x.fg }}>{x.state}</span>
          <span className={s.recordMeta}>{x.meta}</span>
        </div>
      ))}
    </div>
  );
}

export function RecordsAcrossSystems({ sub, legacyTitle, legacy, next, synced, onSync, onOpen }: { sub: string; legacyTitle: string; legacy: SysRecord[]; next: SysRecord[]; synced: string; onSync: () => void; onOpen: (x: SysRecord) => void }) {
  return (
    <section className={s.records}>
      <div className={s.headerRow}>
        <div className={s.headerText}>
          <h2 className={s.title}>Records across systems</h2>
          <span className={s.sub}>{sub}</span>
        </div>
        <Button variant="ghost" size="sm" icon="refresh-cw" onClick={onSync}>Sync now</Button>
      </div>
      <div className={s.recordGrid}>
        <RecordColumn title={legacyTitle} items={legacy} onOpen={onOpen} />
        <RecordColumn title="New, Perforce and Atlassian" items={next} onOpen={onOpen} />
      </div>
      <span className={s.meta}>{synced}</span>
    </section>
  );
}

export function RelatedSection({ title, sub, linkLabel, linked, sugg, pick, onLink, onUnlink, emptyTitle, emptyText }: {
  title: string; sub: string; linkLabel: string; linked: RelRow[]; sugg: RelRow[]; pick: Option[];
  onLink: (id: string) => void; onUnlink: (id: string) => void; emptyTitle: string; emptyText: string;
}) {
  const [open, setOpen] = useState(false);
  const row = (l: RelRow, isLinked: boolean) => (
    <div key={l.id} className={s.relatedRow}>
      <Clickable href={l.href} className={cx('row-link', s.relatedLink)}>
        <span className={s.relatedHead}>
          <span className={s.relatedId}>{l.id}</span>
          <span className={cx('bui-trunc', s.relatedTitle)}>{l.title}</span>
        </span>
        {l.meta ? <span className={s.meta}>{l.meta}</span> : null}
      </Clickable>
      <StatusLabel l={l.stL} fg={l.stFg} icon={l.stIcon} />
      <Button variant="ghost" size="sm" icon={isLinked ? 'x' : 'link'} onClick={() => (isLinked ? onUnlink(l.id) : onLink(l.id))}>{isLinked ? 'Unlink' : 'Link'}</Button>
    </div>
  );
  return (
    <section className={s.section}>
      <div className={s.headerRow}>
        <div className={s.headerText}>
          <h2 className={s.title}>{title}</h2>
          <span className={s.sub}>{sub}</span>
        </div>
        <Button variant="ghost" size="sm" icon="link" onClick={() => setOpen(o => !o)}>{linkLabel}</Button>
      </div>
      {open ? (
        <div className={s.linkPicker}>
          <div className={s.linkPickerField}>
            <Combobox items={pick} value={null} limit={40} onValueChange={v => { if (v) { onLink(v); setOpen(false); } }} placeholder="Search by ID or title" resetOnSelect />
          </div>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      ) : null}
      <div className={s.relatedList}>{linked.map(l => row(l, true))}</div>
      {!linked.length ? <Note icon="link" title={emptyTitle} text={emptyText} /> : null}
      {sugg.length ? (
        <div className={s.suggested}>
          <span className={s.suggestedTitle}>Suggested</span>
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
      {parts(text).map((p, i) => (p.mention ? <span key={i} className={s.mention}>{p.t}</span> : <span key={i}>{p.t}</span>))}
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
            <div key={i} className={s.event}>
              <Person person={who} size={20} />
              <span><strong lang={langOf(who.name)} className={s.eventWho}>{who.name}</strong> <span lang={langOf(a.x)}>{eventText(a.x, who.name)}</span></span>
              <span className={s.eventTime}>{fAt(a.at)}</span>
            </div>
          );
        }
        const isD = a.t === 'd' && a.dec, rs = isD ? RST[a.dec!] : null;
        return (
          <div key={i} className={s.comment}>
            <Person person={who} size={32} />
            <div className={s.commentBody} style={isD && rs ? { borderLeft: '2px solid ' + rs.fg, paddingLeft: 16 } : undefined}>
              <div className={s.commentHead}>
                <strong lang={langOf(who.name)} className={s.commentWho}>{who.name}</strong>
                {isD && rs ? <StatusLabel l={DEC[a.dec!]} fg={rs.fg} icon={rs.icon} size={14} weight={600} /> : null}
                <span className={s.meta}>{fAt(a.at)}</span>
                {a.loc ? <span className={s.commentLocation}><Icon name="file-code" size={14} />{a.loc}</span> : null}
              </div>
              <div lang={langOf(a.x)} className={s.commentText}><RichText text={a.x} /></div>
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
    <div className={s.composer}>
      <Person person={me} size={32} />
      <div className={s.composerMain}>
        <MentionTextarea value={text} onChange={setText} people={people} rows={3} placeholder="Leave a comment. Type @ to mention someone." ariaLabel="Comment" />
        <Attachments items={att} onRemove={i => setAtt(a => a.filter((_, j) => j !== i))} />
        <div className={s.composerActions}>
          <FileButton variant="ghost" size="sm" onFiles={list => setAtt(a => [...a, ...list])}>Attach</FileButton>
          <Button variant="primary" icon="send" onClick={post}>Comment</Button>
        </div>
      </div>
    </div>
  );
}

export function Subscribers({ people, count, note }: { people: PersonView[]; count: string; note: string }) {
  return (
    <div className={s.section}>
      <SideLabel icon="bell" right={count}>Subscribers</SideLabel>
      <div className={s.subscribers}>{people.map(p => <Person key={p.id} person={p} size={28} />)}</div>
      <span className={s.subscribersNote}>{note}</span>
    </div>
  );
}
