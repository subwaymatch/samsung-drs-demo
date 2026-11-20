import { useNavigate } from 'react-router';
import { useMemo } from 'react';
import { MUTED, SEV, SEVORD, UM, USERS } from '@/lib/constants';
import { addD, lbl, TODAY } from '@/lib/dates';
import { archiveTotals, buildEmail, CONTENT_L, keysOf, nextDaily, type Kind } from '@/lib/digest';
import { personOption } from '@/lib/people';
import { modelOptions } from '@/lib/products';
import { setSummary, summaryOf, useApp } from '@/lib/store';
import { cx } from '@/lib/cx';
import type { Severity } from '@/lib/types';
import { EmptyState, Loading, PageHeader } from '../common/basics';
import { Clickable } from '../common/clickable';
import { SideLabel } from '../common/detail';
import { Button, LinkButton } from '../ui/button';
import { Combobox, MultiCombobox } from '../ui/combobox';
import { Icon } from '../ui/icon';
import { Select } from '../ui/select';
import { Checkbox, Segmented, Switch } from '../ui/toggles';
import s from './digests-view.module.css';

const TIMES = ['07:00', '08:00', '08:30', '09:00', '12:00', '18:00'].map(t => ({ value: t, label: t, icon: 'clock', color: MUTED }));
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((l, i) => ({ value: String(i + 1), label: l }));

export function DigestsView({ kind: kindIn, date }: { kind?: string; date?: string }) {
  const app = useApp();
  const navigate = useNavigate();
  const kind: Kind = kindIn === 'weekly' ? 'weekly' : 'daily';
  const keys = keysOf(kind);
  const key = date && keys.includes(date) ? date : keys[keys.length - 1];
  const i = keys.indexOf(key);
  const data = app?.data, prefs = app?.prefs;
  const meId = prefs?.meId || 'u1';
  const ss = useMemo(() => (prefs ? summaryOf(prefs, meId) : null), [prefs, meId]);
  const email = useMemo(() => (data && ss ? buildEmail(data, kind, key, ss, meId) : null), [data, ss, kind, key, meId]);
  const totals = useMemo(() => (data && ss ? archiveTotals(data, kind, ss, meId) : null), [data, ss, kind, meId]);
  const archive = useMemo(() => (totals ? [...keys].reverse().map(k => ({ value: k, label: lbl(k) + ', ' + k.slice(0, 4), sub: totals[k] + ' updates' })) : []), [totals, keys]);
  const models = useMemo(() => modelOptions(), []);
  const cc = useMemo(() => USERS.filter(u => u.id !== meId).map(u => ({ ...personOption(u.id), sub: u.email })), [meId]);
  if (!app || !email || !ss) return <Loading />;
  const me = UM[meId];
  const go = (k: string) => navigate(`/digests/${kind}/${k}`);
  const set = (patch: Parameters<typeof setSummary>[1]) => setSummary(meId, patch);
  const sundayAfter = addD(TODAY, 7 - new Date(+TODAY.slice(0, 4), +TODAY.slice(5, 7) - 1, +TODAY.slice(8, 10)).getDay());

  return (
    <div className={s.page}>
      <PageHeader title="Email Digests" />
      <div className={s.layout}>
        <div className={s.preview}>
          <div className={s.toolbar}>
            <div className={s.kindTabs}>
              <Segmented ariaLabel="Digest" items={[{ value: 'daily', label: 'Daily', icon: 'inbox' }, { value: 'weekly', label: 'Weekly', icon: 'calendar' }]} value={kind} onValueChange={v => navigate('/digests/' + v)} />
            </div>
            <div className={s.archiveNav}>
              <Button variant="ghost" icon="chevron-left" iconOnly title="Older" onClick={() => i > 0 && go(keys[i - 1])} disabled={i <= 0} />
              <div className={s.archivePicker}>
                <Combobox items={archive} value={key} limit={60} onValueChange={v => v && go(v)} placeholder="Find a date" leadIcon="calendar" ariaLabel="Find a date" />
              </div>
              <Button variant="ghost" icon="chevron-right" iconOnly title="Newer" onClick={() => i < keys.length - 1 && go(keys[i + 1])} disabled={i >= keys.length - 1} />
            </div>
          </div>
          <article className={s.email}>
            <div className={s.headers}>
              <span className={s.headerName}>From</span><span>DRS Notifications &lt;drs-noreply@example.com&gt;</span>
              <span className={s.headerName}>To</span><span className={s.address}>{[me.email, ...ss.cc.map(u => (UM[u] || { email: '' }).email).filter(Boolean)].join(', ')}</span>
              <span className={s.headerName}>Sent</span><span>{email.sentAt}</span>
            </div>
            <div className={s.intro}>
              <h2 className={s.subject}>{email.subject}</h2>
              <p className={s.greeting}>{email.greeting}</p>
            </div>
            <div className={s.stats}>
              {email.stats.map(x => (
                <div key={x.label} className={s.stat}>
                  <span className={s.statLabel}>{x.label}</span>
                  <span className={s.statValue}>{x.n}</span>
                </div>
              ))}
            </div>
            {email.sections.map(sec => (
              <section key={sec.key} className={s.emailSection}>
                <div className={s.sectionHead}>
                  <Icon name={sec.icon} size={16} color="var(--color-muted)" />
                  <h3 className={s.heading}>{sec.title}</h3>
                  <span className={s.sectionCount}>{sec.count}</span>
                </div>
                {sec.items.map((it, j) => (
                  <Clickable key={it.id + j} href={it.href} className={cx('row-link', s.item)}>
                    <Icon name={it.icon} size={16} color={it.color} />
                    <span className={s.itemId}>{it.id}</span>
                    <div className={s.itemText}><span className={cx('bui-trunc', s.itemTitle)}>{it.title}</span><span className={cx('bui-trunc', s.itemMeta)}>{it.meta}</span></div>
                  </Clickable>
                ))}
                {sec.count > 8 ? <div className={s.more}><LinkButton href={sec.moreHref} variant="link" size="sm">{sec.more}</LinkButton></div> : null}
              </section>
            ))}
            {!email.sections.length ? <EmptyState art="calendar" title="No activity in this period" text="Nothing matched your summary settings. Try a longer period or include more people." /> : null}
            <p className={s.footer}>{email.footer}</p>
          </article>
        </div>

        <aside className={s.settings}>
          <div className={s.settingsHead}>
            <h2 className={s.sideTitle}>Email settings</h2>
            <span className={s.settingsSub}>Changes save automatically. The email preview uses your current filters.</span>
          </div>
          <section className={s.delivery}>
            <SideLabel icon="send">Delivery</SideLabel>
            <Switch checked={ss.daily} onCheckedChange={v => set({ daily: v })} label="Daily summary" sub="Every weekday" />
            <div className={s.dailySchedule}><Select ariaLabel="Daily time" items={TIMES} value={ss.dailyTime} onValueChange={v => set({ dailyTime: v })} /></div>
            <Switch checked={ss.weekly} onCheckedChange={v => set({ weekly: v })} label="Weekly summary" sub="Covers the previous Monday to Sunday" />
            <div className={s.weeklySchedule}>
              <Select ariaLabel="Weekly day" items={DAYS} value={ss.weeklyDay} onValueChange={v => set({ weeklyDay: v })} />
              <Select ariaLabel="Weekly time" items={TIMES} value={ss.weeklyTime} onValueChange={v => set({ weeklyTime: v })} />
            </div>
            {[ss.daily && { label: 'Next daily summary', when: `${lbl(nextDaily())} at ${ss.dailyTime}` }, ss.weekly && { label: 'Next weekly summary', when: `${lbl(addD(sundayAfter, +ss.weeklyDay))} at ${ss.weeklyTime}` }]
              .filter((x): x is { label: string; when: string } => !!x)
              .map(n => (
                <span key={n.label} className={s.next}>
                  <span className={s.nextIcon}><Icon name="clock" size={14} /></span>
                  <span className={s.nextText}><span className={s.nextLabel}>{n.label}</span><span className={s.nextWhen}>{n.when}</span></span>
                </span>
              ))}
          </section>
          <section className={s.include}>
            <SideLabel icon="list-checks">Include</SideLabel>
            {CONTENT_L.map(([k, l]) => <Checkbox key={k} label={l} checked={ss.content[k]} onCheckedChange={v => set({ content: { ...ss.content, [k]: v } })} />)}
          </section>
          <section className={s.filters}>
            <SideLabel icon="filter">Filters</SideLabel>
            <div className={s.field}><span className={s.fieldLabel}>Models</span><MultiCombobox items={models} value={ss.models} onValueChange={v => set({ models: v })} placeholder="All models" ariaLabel="Models" /></div>
            <div className={s.field}>
              <span id="minsev-l" className={s.fieldLabel}>Minimum severity</span>
              <div role="radiogroup" aria-labelledby="minsev-l" className={s.severities}>
                {([...SEVORD].reverse() as Severity[]).map(k => {
                  const on = ss.minSev === k;
                  return (
                    <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set({ minSev: k })} className={s.severity}>
                      <span className={s.radio} style={{ border: on ? '1.5px solid var(--color-accent)' : '1.5px solid oklch(0.82 0.01 290)' }}>
                        <span className={s.radioDot} style={{ opacity: on ? 1 : 0 }} />
                      </span>
                      <Icon name={SEV[k].icon} size={14} color={SEV[k].c} />
                      <span style={{ fontWeight: on ? 600 : 400 }}>{SEV[k].l}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <section className={s.recipients}>
            <SideLabel icon="users">Recipients</SideLabel>
            <span className={s.me}>
              <Icon name="mail" size={16} color="var(--color-muted)" />
              <span className={s.address}>{me.email}</span>
              <span className={s.meBadge}>Me</span>
            </span>
            <span className={s.fieldLabel}>Also send to</span>
            <MultiCombobox items={cc} value={ss.cc} onValueChange={v => set({ cc: v })} placeholder="Add people" ariaLabel="Also send to" />
          </section>
        </aside>
      </div>
    </div>
  );
}
