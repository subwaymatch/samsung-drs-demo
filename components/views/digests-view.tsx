'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { MUTED, SEV, SEVORD, UM, USERS } from '@/lib/constants';
import { addD, lbl, TODAY } from '@/lib/dates';
import { archiveTotals, buildEmail, CONTENT_L, keysOf, nextDaily, type Kind } from '@/lib/digest';
import { personOption } from '@/lib/people';
import { modelOptions } from '@/lib/products';
import { setSummary, summaryOf, useApp } from '@/lib/store';
import type { Severity } from '@/lib/types';
import { Loading, Note, PageHeader } from '../common/basics';
import { Clickable } from '../common/clickable';
import { SideLabel } from '../common/detail';
import { Button, LinkButton } from '../ui/button';
import { Combobox, MultiCombobox } from '../ui/combobox';
import { Icon } from '../ui/icon';
import { Select } from '../ui/select';
import { Checkbox, Segmented, Switch } from '../ui/toggles';

const TIMES = ['07:00', '08:00', '08:30', '09:00', '12:00', '18:00'].map(t => ({ value: t, label: t, icon: 'clock', color: MUTED }));
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((l, i) => ({ value: String(i + 1), label: l }));

export function DigestsView({ kind: kindIn, date }: { kind?: string; date?: string }) {
  const app = useApp();
  const router = useRouter();
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
  const go = (k: string) => router.push(`/digests/${kind}/${k}`);
  const set = (patch: Parameters<typeof setSummary>[1]) => setSummary(meId, patch);
  const sundayAfter = addD(TODAY, 7 - new Date(+TODAY.slice(0, 4), +TODAY.slice(5, 7) - 1, +TODAY.slice(8, 10)).getDay());

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <PageHeader title="Email digests" sub="Automated daily and weekly emails summarizing defects and code reviews" />
      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="max-w-full overflow-x-auto">
              <Segmented ariaLabel="Digest" items={[{ value: 'daily', label: 'Daily', icon: 'inbox' }, { value: 'weekly', label: 'Weekly', icon: 'calendar' }]} value={kind} onValueChange={v => router.push('/digests/' + v)} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" icon="chevron-left" iconOnly title="Older" onClick={() => i > 0 && go(keys[i - 1])} disabled={i <= 0} />
              <div className="w-[250px] max-w-[60vw]">
                <Combobox items={archive} value={key} limit={60} onValueChange={v => v && go(v)} placeholder="Find a date" leadIcon="calendar" ariaLabel="Find a date" />
              </div>
              <Button variant="ghost" icon="chevron-right" iconOnly title="Newer" onClick={() => i < keys.length - 1 && go(keys[i + 1])} disabled={i >= keys.length - 1} />
            </div>
          </div>
          <article className="flex flex-col gap-7 border-t border-line pt-6">
            <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-4 gap-y-2">
              <span className="text-muted">From</span><span>DRS Notifications &lt;drs-noreply@example.com&gt;</span>
              <span className="text-muted">To</span><span className="[overflow-wrap:anywhere]">{[me.email, ...ss.cc.map(u => (UM[u] || { email: '' }).email).filter(Boolean)].join(', ')}</span>
              <span className="text-muted">Sent</span><span>{email.sentAt}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <h2 className="text-2xl leading-[1.35] font-bold tracking-[-0.02em]">{email.subject}</h2>
              <p className="leading-[1.7] text-ink-3">{email.greeting}</p>
            </div>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
              {email.stats.map(x => (
                <div key={x.label} className="flex flex-col gap-1.5 border-l-2 border-accent-rule py-0.5 pl-4">
                  <span className="text-sm font-semibold text-muted">{x.label}</span>
                  <span className="text-2xl font-bold tabular-nums">{x.n}</span>
                </div>
              ))}
            </div>
            {email.sections.map(sec => (
              <section key={sec.key} className="flex flex-col">
                <div className="flex items-center gap-2.5 border-b border-line pb-2.5">
                  <Icon name={sec.icon} size={16} color="var(--color-muted)" />
                  <h3 className="text-base font-[650]">{sec.title}</h3>
                  <span className="text-sm text-muted tabular-nums">{sec.count}</span>
                </div>
                {sec.items.map((it, j) => (
                  <Clickable key={it.id + j} href={it.href} className="row-link grid grid-cols-[16px_92px_minmax(0,1fr)] items-center gap-3 border-b border-line-soft py-3 last:border-b-0">
                    <Icon name={it.icon} size={16} color={it.color} />
                    <span className="font-mono text-sm text-muted">{it.id}</span>
                    <div className="flex min-w-0 flex-col gap-[3px]"><span className="bui-trunc font-[550]">{it.title}</span><span className="bui-trunc text-sm text-muted">{it.meta}</span></div>
                  </Clickable>
                ))}
                {sec.count > 8 ? <div className="flex pt-2.5"><LinkButton href={sec.moreHref} variant="link" size="sm">{sec.more}</LinkButton></div> : null}
              </section>
            ))}
            {!email.sections.length ? <Note icon="inbox" title="No activity in this period" text="Nothing matched your summary settings. Try a longer period or include more people." /> : null}
            <p className="border-t border-line pt-5 text-sm leading-[1.6] text-muted">{email.footer}</p>
          </article>
        </div>

        <aside className="flex min-w-[280px] flex-[0_1_320px] flex-col gap-7 border-l border-line pl-8 max-[900px]:border-l-0 max-[900px]:pl-0">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-[650]">Email settings</h2>
            <span className="text-sm leading-normal text-muted">Changes save automatically. The email preview uses your current filters.</span>
          </div>
          <section className="flex flex-col gap-4">
            <SideLabel icon="send">Delivery</SideLabel>
            <Switch checked={ss.daily} onCheckedChange={v => set({ daily: v })} label="Daily summary" sub="Every weekday" />
            <div className="pl-[46px]"><Select ariaLabel="Daily time" items={TIMES} value={ss.dailyTime} onValueChange={v => set({ dailyTime: v })} /></div>
            <Switch checked={ss.weekly} onCheckedChange={v => set({ weekly: v })} label="Weekly summary" sub="Covers the previous Monday to Sunday" />
            <div className="grid grid-cols-2 gap-2 pl-[46px]">
              <Select ariaLabel="Weekly day" items={DAYS} value={ss.weeklyDay} onValueChange={v => set({ weeklyDay: v })} />
              <Select ariaLabel="Weekly time" items={TIMES} value={ss.weeklyTime} onValueChange={v => set({ weeklyTime: v })} />
            </div>
            {[ss.daily && { label: 'Next daily summary', when: `${lbl(nextDaily())} at ${ss.dailyTime}` }, ss.weekly && { label: 'Next weekly summary', when: `${lbl(addD(sundayAfter, +ss.weeklyDay))} at ${ss.weeklyTime}` }]
              .filter((x): x is { label: string; when: string } => !!x)
              .map(n => (
                <span key={n.label} className="flex items-start gap-2 text-sm text-muted">
                  <span className="flex h-5 flex-none items-center"><Icon name="clock" size={14} /></span>
                  <span className="flex flex-col gap-[5px]"><span className="leading-5">{n.label}</span><span className="font-[550] text-ink-2">{n.when}</span></span>
                </span>
              ))}
          </section>
          <section className="flex flex-col gap-3.5 border-t border-line pt-6">
            <SideLabel icon="list-checks">Include</SideLabel>
            {CONTENT_L.map(([k, l]) => <Checkbox key={k} label={l} checked={ss.content[k]} onCheckedChange={v => set({ content: { ...ss.content, [k]: v } })} />)}
          </section>
          <section className="flex flex-col gap-4 border-t border-line pt-6">
            <SideLabel icon="filter">Filters</SideLabel>
            <div className="flex flex-col gap-2"><span className="text-sm text-muted">Models</span><MultiCombobox items={models} value={ss.models} onValueChange={v => set({ models: v })} placeholder="All models" ariaLabel="Models" /></div>
            <div className="flex flex-col gap-2">
              <span id="minsev-l" className="text-sm text-muted">Minimum severity</span>
              <div role="radiogroup" aria-labelledby="minsev-l" className="flex flex-col gap-0.5">
                {([...SEVORD].reverse() as Severity[]).map(k => {
                  const on = ss.minSev === k;
                  return (
                    <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set({ minSev: k })} className="-mx-2 flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-inherit hover:text-accent-ink">
                      <span className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-white" style={{ border: on ? '1.5px solid var(--color-accent)' : '1.5px solid oklch(0.82 0.01 290)' }}>
                        <span className="h-2 w-2 rounded-full bg-accent" style={{ opacity: on ? 1 : 0 }} />
                      </span>
                      <Icon name={SEV[k].icon} size={14} color={SEV[k].c} />
                      <span style={{ fontWeight: on ? 600 : 400 }}>{SEV[k].l}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <SideLabel icon="users">Recipients</SideLabel>
            <span className="flex min-w-0 items-center gap-2.5">
              <Icon name="mail" size={16} color="var(--color-muted)" />
              <span className="[overflow-wrap:anywhere]">{me.email}</span>
              <span className="inline-flex h-5 flex-none items-center rounded-[3px] bg-accent-soft px-[7px] text-sm font-semibold text-accent-ink">Me</span>
            </span>
            <span className="text-sm text-muted">Also send to</span>
            <MultiCombobox items={cc} value={ss.cc} onValueChange={v => set({ cc: v })} placeholder="Add people" ariaLabel="Also send to" />
          </section>
        </aside>
      </div>
    </div>
  );
}
