'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { MODELS, TEAMS } from '@/lib/constants';
import { fFull, TNOW } from '@/lib/dates';
import { computeInsights, RANGES } from '@/lib/insights';
import { systemGraph } from '@/lib/relations';
import { useApp } from '@/lib/store';
import { Loading, PageHeader, Section, SectionTitle, Thumb } from '../common/basics';
import { Clickable } from '../common/clickable';
import { RelGraph } from '../graphs/rel-graph';
import { useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { PeopleStack, Person } from '../ui/person';

const TWO_UP = 'grid gap-x-14 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]';
const KPI_GRID = { gridTemplateColumns: 'repeat(auto-fit,minmax(clamp(calc((100% - 72px) / 4),(900px - 100%) * 999,clamp(calc((100% - 24px) / 2),(440px - 100%) * 999,100%)),1fr))' };
const TH = 'py-3 text-sm font-semibold text-muted';

function Bar({ w, c, h = 6 }: { w: string; c: string; h?: number }) {
  return (
    <span className="flex-1 overflow-hidden rounded-[1px] border border-[oklch(0.92_0.02_293)]" style={{ height: h }}>
      <span className="block h-full" style={{ width: w, background: c }} />
    </span>
  );
}

export function InsightsView() {
  const app = useApp();
  const router = useRouter();
  const { ui, setUi, mainW } = useShell();
  const range = RANGES.some(r => r.n === ui.range) ? ui.range : 30;
  const data = app?.data;
  const st = useMemo(() => (data ? computeInsights(data, range) : null), [data, range]);
  const graph = useMemo(() => (data ? systemGraph(data) : null), [data]);
  if (!app || !st || !graph) return <Loading />;
  const compMore = st.byComp.length > 6, compOpen = ui.compOpen;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
      <PageHeader
        title="Insights"
        sub={`${app.data.defects.length} defects and ${app.data.reviews.length} code reviews from ${TEAMS.length} teams across ${MODELS.length} printer and copier models.`}
        action={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-1 text-sm text-ink-5">
            <span className="flex items-center gap-2">
              <Icon name="calendar-clock" size={16} color="var(--color-accent-ink)" />
              Data through {fFull(TNOW)}, {TNOW.slice(11)}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.14_155)]" />
              All systems in sync
            </span>
          </div>
        }
      />

      <section className="flex flex-col gap-3">
        <div
          className="overflow-hidden border-y border-[oklch(0.92_0.01_290)] bg-surface"
          style={mainW ? { width: mainW, marginLeft: `calc(50% - ${mainW / 2}px)` } : undefined}
        >
          {mainW > 0 && mainW < 640 ? <SystemList graph={graph} /> : <RelGraph nodes={graph.nodes} edges={graph.edges} height={680} />}
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-ink-5">
          <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.14_155)]" />Connected and in sync</span>
          <span className="flex items-center gap-2"><span className="w-6 border-t-[1.5px] border-dashed border-[oklch(0.55_0.17_293)]" />Records synced through DRS</span>
        </div>
      </section>

      <div className={TWO_UP}>
        <Section title="Defects by migration state" sub={st.mig.sub}>
          <div className="relative w-full max-w-[560px] self-center">
            <svg viewBox="0 0 520 280" role="img" aria-label="Defects by migration state" className="block h-auto w-full overflow-visible">
              {st.mig.donut.map(p => (
                <path
                  key={p.label}
                  d={p.d}
                  fill={p.c}
                  stroke="#fff"
                  strokeWidth={2}
                  role="link"
                  tabIndex={0}
                  aria-label={p.tip}
                  className="focus-ring cursor-pointer hover:opacity-80"
                  onClick={() => router.push(p.href)}
                  onKeyDown={e => { if (e.key === 'Enter') router.push(p.href); }}
                >
                  <title>{p.tip}</title>
                </path>
              ))}
              {st.mig.donut.map(p => <polyline key={'l' + p.label} points={p.lp} fill="none" stroke="oklch(0.62 0.02 290)" strokeWidth={1} />)}
              {st.mig.donut.map(p => <circle key={'c' + p.label} cx={p.dx} cy={p.dy} r={3} fill="oklch(0.45 0.02 290)" />)}
            </svg>
            {st.mig.donut.map(p => (
              <Clickable key={'t' + p.label} href={p.href} className="absolute flex flex-col gap-0.5 whitespace-nowrap hover:text-accent-text" style={{ left: p.lx, top: p.ly, transform: p.tr, textAlign: p.ta }}>
                <span className="font-semibold">{p.label}</span>
                <span className="text-sm text-muted tabular-nums">{p.val}</span>
              </Clickable>
            ))}
            <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5">
              <span className="text-[28px] leading-none font-bold tabular-nums">{st.mig.total}</span>
              <span className="text-sm text-muted">defects</span>
            </div>
          </div>
        </Section>

        <Section
          title="Migration by component"
          sub="Components move to Jira in waves"
          right={
            <div className="flex flex-wrap items-center gap-3.5 text-sm text-ink-5">
              {st.mig.states.map(s => (
                <span key={s.k} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px]" style={{ background: s.c }} />{s.label}</span>
              ))}
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            <div id="comp-list" className="relative overflow-hidden" style={{ maxHeight: compOpen || !compMore ? 'none' : 300 }}>
              <div className="flex flex-col gap-3.5">
                {st.byComp.map(m => (
                  <div key={m.comp} className="grid grid-cols-[150px_minmax(0,1fr)_32px] items-center gap-4">
                    <Clickable href={m.href} className="flex min-w-0 flex-col gap-0.5 hover:text-accent">
                      <span className="bui-trunc">{m.comp}</span>
                      <span className="text-sm text-muted">{m.wave}</span>
                    </Clickable>
                    <div className="flex h-3 gap-0.5" style={{ width: m.w }}>
                      {m.segs.map(s => <Clickable key={s.tip} href={s.href} title={s.tip} className="rounded-[1px] hover:opacity-75" style={{ flex: s.n, background: s.c }} />)}
                    </div>
                    <span className="text-right font-semibold tabular-nums">{m.total}</span>
                  </div>
                ))}
              </div>
              {compMore && !compOpen ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),#fff_85%)]" /> : null}
            </div>
            {compMore ? (
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" icon={compOpen ? 'chevron-up' : 'chevron-down'} ariaExpanded={compOpen} ariaControls="comp-list" onClick={() => setUi({ compOpen: !compOpen })}>
                  {compOpen ? 'Show fewer' : `Show all ${st.byComp.length} components`}
                </Button>
              </div>
            ) : null}
          </div>
        </Section>
      </div>

      <div className="sticky z-30 -mt-4 -mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-white" style={{ top: 'var(--topbar-h, 0px)' }}>
        <div className="flex min-h-12 items-center gap-2.5 text-muted">
          <Icon name="calendar" size={16} color="oklch(0.55 0.12 293)" />
          <span>Showing</span>
          <span className="font-[650] text-ink tabular-nums">{st.periodL}</span>
        </div>
        <div role="tablist" aria-label="Reporting period" className="-mb-px flex items-stretch gap-6 self-stretch overflow-x-auto overflow-y-hidden [scrollbar-width:none] max-sm:pr-6 max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)]">
          {RANGES.map(r => {
            const on = r.n === range;
            return (
              <button
                key={r.n}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setUi({ range: r.n })}
                className="flex min-h-12 cursor-pointer items-center gap-[7px] border-0 border-b-2 border-solid bg-transparent px-0.5 text-sm whitespace-nowrap hover:text-accent-ink"
                style={{ borderBottomColor: on ? 'var(--color-accent)' : 'transparent', color: on ? 'var(--color-accent-ink)' : 'var(--color-ink-5)', fontWeight: on ? 650 : 500 }}
              >
                <Icon name={r.icon} size={15} />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-7" style={KPI_GRID}>
        {st.kpis.map(k => (
          <Clickable key={k.label} href={k.href} className="flex flex-col gap-2 border-l-2 border-accent-rule py-0.5 pl-5 hover:border-accent-bar">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-semibold text-ink-5">{k.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[32px] leading-[1.1] font-bold tracking-[-0.02em] tabular-nums">{k.value}</span>
                  <span className="font-[550] text-muted">{k.unit}</span>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.art} alt="" width={64} height={64} decoding="async" className="block flex-none" />
            </div>
            <span className="text-sm font-semibold" style={{ color: k.dc }}>{k.delta}</span>
            <span className="text-sm text-muted">{k.sub}</span>
          </Clickable>
        ))}
      </div>

      <Section title="Severity targets" sub={st.tgSub} gap="gap-3">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className={'grid grid-cols-[minmax(0,1.1fr)_1fr_1.4fr_1fr_1.4fr_1fr] gap-5 border-b border-line ' + TH}>
              <span>Severity</span><span>Respond within</span><span>Responded on time</span><span>Resolve within</span><span>Resolved on time</span><span className="text-right">Open past target</span>
            </div>
            {st.tg.map(t => (
              <Clickable key={t.k} href={t.href} className="row-link grid grid-cols-[minmax(0,1.1fr)_1fr_1.4fr_1fr_1.4fr_1fr] items-center gap-5 border-b border-line-soft py-4 last:border-b-0">
                <span className="flex items-center gap-2 font-[550]"><Icon name={t.icon} color={t.c} size={16} />{t.l}</span>
                <span>{t.rl}</span>
                <span className="flex items-center gap-3"><Bar w={t.rw} c={t.rc} /><span className="w-9 text-right text-sm tabular-nums">{t.rp}</span></span>
                <span>{t.fl}</span>
                <span className="flex items-center gap-3"><Bar w={t.fw} c={t.fc} /><span className="w-9 text-right text-sm tabular-nums">{t.fp}</span></span>
                <span className="text-right font-semibold tabular-nums" style={{ color: t.lateFg }}>{t.late}</span>
              </Clickable>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Code review turnaround"
        sub={`Median hours from submission to first review decision, ${st.bucketL}`}
        gap="gap-6"
        right={
          <div className="flex items-center gap-5 text-sm text-ink-5">
            <span className="flex items-center gap-[7px]"><span className="h-2.5 w-2.5 rounded-[2px] bg-[oklch(0.62_0.14_155)]" />Within 48h target</span>
            <span className="flex items-center gap-[7px]"><span className="h-2.5 w-2.5 rounded-[2px] bg-[oklch(0.78_0.14_75)]" />Over target</span>
          </div>
        }
      >
        <div className="flex flex-col gap-2.5">
          <div className="relative ml-9 h-[220px]" role="group" aria-label={'Code review turnaround chart. ' + st.tatSummary}>
            {st.ticks.map(t => (
              <div key={t.l} className="absolute inset-x-0 border-t border-[oklch(0.94_0.006_290)]" style={{ bottom: t.pos }}>
                <span className="absolute -top-2 -left-9 w-7 text-right text-sm text-faint tabular-nums">{t.l}</span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end" style={{ gap: st.gap }}>
              {st.tat.map((b, i) => (
                <Clickable key={i} href={b.href || undefined} tip={b.tip} tipAlign={tipAlign(i, st.tat.length)} ariaLabel={b.tip.replace('\n', ': ')} className="min-w-0 flex-1 rounded-t-[2px] hover:opacity-75" style={{ height: b.h, background: b.c }} />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-[oklch(0.35_0.01_290)]" style={{ bottom: st.targetPos }}>
              <span className="absolute -top-5 right-0 bg-white px-1 text-sm font-semibold text-[oklch(0.3_0.01_290)]">Target 48h</span>
            </div>
          </div>
          <div className="ml-9 flex" style={{ gap: st.gap }} aria-hidden>
            {st.tat.map((b, i) => (
              <span key={i} className="flex min-w-0 flex-1 overflow-visible text-sm whitespace-nowrap text-muted" style={{ justifyContent: b.ja }}>{b.label}</span>
            ))}
          </div>
          <DataTable caption="Code review turnaround" head={['Period', 'Median turnaround', 'Decisions']} rows={st.tat.map(b => [b.span, b.v, String(b.n)])} />
        </div>
      </Section>

      <div className={TWO_UP}>
        <Section
          title="Defects reported vs resolved"
          sub={st.flowSub}
          right={
            <div className="flex items-center gap-4 text-sm text-ink-5">
              <span className="flex items-center gap-[7px]"><span className="h-2.5 w-2.5 rounded-[2px] bg-[oklch(0.55_0.17_293)]" />Reported</span>
              <span className="flex items-center gap-[7px]"><span className="h-2.5 w-2.5 rounded-[2px] bg-[oklch(0.68_0.14_160)]" />Resolved</span>
            </div>
          }
        >
          <div className="flex flex-1 flex-col gap-2.5">
            <div className="relative ml-8 min-h-[240px] flex-1" role="group" aria-label={'Defects reported vs resolved chart. ' + st.flowNote}>
              {st.flowTicks.map(t => (
                <div key={t.l} className="absolute inset-x-0 border-t border-[oklch(0.94_0.006_290)]" style={{ bottom: t.pos }}>
                  <span className="absolute -top-2.5 -left-8 w-6 text-right text-sm text-muted tabular-nums">{t.l}</span>
                </div>
              ))}
              <div className="absolute inset-0 flex items-end" style={{ gap: st.flowGap }}>
                {st.flow.map((b, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 items-end gap-0.5">
                    <Clickable href={b.href1} tip={b.tip1} tipAlign={tipAlign(i, st.flow.length)} ariaLabel={b.tip1.replace('\n', ': ')} className="flex-1 rounded-t-[2px] bg-[oklch(0.55_0.17_293)] hover:opacity-75" style={{ height: b.h1 }} />
                    <Clickable href={b.href2} tip={b.tip2} tipAlign={tipAlign(i, st.flow.length)} ariaLabel={b.tip2.replace('\n', ': ')} className="flex-1 rounded-t-[2px] bg-[oklch(0.68_0.14_160)] hover:opacity-75" style={{ height: b.h2 }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="ml-8 flex" style={{ gap: st.flowGap }} aria-hidden>
              {st.flow.map((b, i) => <span key={i} className="min-w-0 flex-1 overflow-visible text-sm whitespace-nowrap text-muted">{b.label}</span>)}
            </div>
          </div>
          <span className="text-sm text-ink-5">{st.flowNote}</span>
          <DataTable caption="Defects reported vs resolved" head={['Period', 'Reported', 'Resolved']} rows={st.flow.map(b => [b.span, String(b.rep), String(b.res)])} />
        </Section>

        <Section title="Review outcomes" sub={st.outcomeSub}>
          <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]" aria-hidden>
            {st.waffle.map((c, i) => <div key={i} data-tip={c.tip} data-tip-align={i % 20 < 4 ? 'start' : i % 20 > 15 ? 'end' : undefined} className="aspect-square rounded-[2px]" style={{ background: c.c }} />)}
          </div>
          <span className="text-sm text-muted">Each square is 1% of submitted reviews</span>
          <div className="flex flex-col">
            {st.outcomes.map(o => (
              <Clickable key={o.k} href={o.href} className="row-link flex items-center gap-3 border-b border-line-soft py-3.5 last:border-b-0">
                <span className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: o.c }} />
                <div className="flex flex-1 flex-col gap-[3px]"><span className="font-[550]">{o.label}</span><span className="text-sm text-muted">{o.desc}</span></div>
                <span className="text-sm text-muted tabular-nums">{o.n}</span>
                <span className="w-14 text-right font-[650] tabular-nums">{o.pct}</span>
              </Clickable>
            ))}
          </div>
        </Section>

        <Section
          title="Open defects by product line"
          sub="Open and in-progress defects by severity. Models in a line share a firmware base."
          right={
            <div className="flex items-center gap-2 text-sm text-ink-5">
              <span>Fewer</span><span className="h-2 w-[72px] rounded-[2px] bg-[linear-gradient(90deg,oklch(0.95_0.04_293),oklch(0.5_0.19_293))]" /><span>More</span>
            </div>
          }
        >
          <div className="flex flex-col gap-1 overflow-x-auto">
            <div className="grid grid-cols-[minmax(150px,1.9fr)_repeat(4,minmax(52px,1fr))_44px] items-center gap-1 pb-1">
              <span />
              {st.heatCols.map(h => (
                <span key={h.l} className="flex items-center justify-center gap-1.5 text-sm font-semibold whitespace-nowrap text-ink-5"><Icon name={h.icon} color={h.c} size={14} />{h.l}</span>
              ))}
              <span className="text-right text-sm font-semibold text-ink-5">Total</span>
            </div>
            {st.heat.length ? st.heat.map(m => (
              <div key={m.model} className="grid grid-cols-[minmax(150px,1.9fr)_repeat(4,minmax(52px,1fr))_44px] items-center gap-1">
                <Clickable href={m.href} className="flex min-w-0 flex-col gap-[3px] text-[oklch(0.3_0.03_293)] hover:text-accent">
                  <span className="bui-trunc font-[550]">{m.model}</span>
                  <span className="bui-trunc text-sm text-muted">{m.sub}</span>
                </Clickable>
                {m.cells.map((c, i) => (
                  <Clickable key={i} href={c.href} tip={c.tip} ariaLabel={c.tip} className="flex h-[50px] items-center justify-center rounded font-semibold tabular-nums hover:shadow-[inset_0_0_0_2px_oklch(0.4_0.19_293)]" style={{ background: c.bg, color: c.fg }}>
                    {c.n}
                  </Clickable>
                ))}
                <span className="text-right font-[650] tabular-nums">{m.total}</span>
              </div>
            )) : <span className="py-6 text-muted">No open defects.</span>}
            {st.heat.length ? (
              <div className="mt-2 grid grid-cols-[minmax(150px,1.9fr)_repeat(4,minmax(52px,1fr))_44px] items-center gap-1 border-t border-line pt-3">
                <span className="flex flex-col gap-[3px]"><span className="font-[550]">Unique open defects</span><span className="text-sm text-muted">Each defect counted once</span></span>
                {st.heatUnique.cells.map((n, i) => <span key={i} className="text-center font-semibold tabular-nums">{n || '-'}</span>)}
                <span className="text-right font-[650] tabular-nums">{st.heatUnique.total}</span>
              </div>
            ) : null}
          </div>
          {st.heatUnique.multi ? <span className="text-sm text-muted">A defect that affects several lines is counted in each, so the rows add up to more than the unique total.</span> : null}
        </Section>

        <Section title="Turnaround by change type" sub="Most common change types, median hours to first decision, dashed line is the 48h target">
          <div className="flex flex-col gap-[18px]">
            {st.byType.map(t => (
              <Clickable key={t.type} href={t.href} className="row-link grid grid-cols-[140px_minmax(0,1fr)_56px] items-center gap-4 py-1">
                <div className="flex items-center gap-2.5">
                  <Icon name={t.icon} size={16} color="var(--color-muted)" />
                  <div className="flex flex-col gap-0.5"><span>{t.type}</span><span className="text-sm text-muted">{t.nL}</span></div>
                </div>
                <div className="relative h-3">
                  <div className="h-full rounded-[1px]" style={{ width: t.w, background: t.c }} />
                  <div className="absolute -top-[5px] -bottom-[5px] border-l-[1.5px] border-dashed border-[oklch(0.35_0.01_290)]" style={{ left: st.typeTarget }} />
                </div>
                <span className="text-right font-semibold tabular-nums">{t.v}</span>
              </Clickable>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10">
        <ActiveList title="Most active defects" sub="Comments, status changes and assignments in the selected period. Ties go to the most recently active." rows={st.activeD} idW={128} />
        <ActiveList title="Most active code reviews" sub="Comments, reviewer assignments and decisions in the selected period. Ties go to the most recently active." rows={st.activeR} idW={96} />
      </div>

      <Section title="Code review team" sub="Reviewer workload and responsiveness in the selected period" gap="gap-3">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className={'grid grid-cols-[minmax(0,1.6fr)_1fr_1fr_1.4fr_1fr] gap-5 border-b border-line ' + TH}>
              <span>Reviewer</span><span className="text-right" title="Each reviewer's first decision on a review. A review with two reviewers counts once for each.">Reviewer decisions</span><span className="text-right">Median</span><span>Within 48h</span><span className="text-right">In queue now</span>
            </div>
            {st.team.map(r => (
              <Clickable key={r.id} href={r.href} className="row-link grid grid-cols-[minmax(0,1.6fr)_1fr_1fr_1.4fr_1fr] items-center gap-5 border-b border-line-soft py-4 last:border-b-0">
                <span className="flex items-center gap-3">
                  <Person person={r.u} size={32} />
                  <span className="flex flex-col gap-0.5"><span className="font-[550]">{r.u.name}</span><span className="text-sm text-muted">{r.u.title}</span></span>
                </span>
                <span className="text-right tabular-nums">{r.n}</span>
                <span className="text-right font-semibold tabular-nums">{r.med}</span>
                <span className="flex items-center gap-3"><Bar w={r.pctW} c={r.pc} /><span className="w-9 text-right text-sm tabular-nums">{r.pct}</span></span>
                <span className="text-right tabular-nums">{r.queue}</span>
              </Clickable>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

type Graph = ReturnType<typeof systemGraph>;
type SysData = { name: string; role: string; logo?: string; sync?: string; meta?: string; href?: string; label?: string; note?: string; metaLines?: { icon: string; text: string }[] };

/** The seven-system diagram as a list, for phones: legacy systems, DRS, then the new systems. */
function SystemList({ graph }: { graph: Graph }) {
  const sys = graph.nodes.filter(n => n.type === 'sys' && n.id !== 'hub');
  const labels = graph.nodes.filter(n => n.type === 'label').map(n => n.data as unknown as SysData);
  const hub = graph.nodes.find(n => n.id === 'hub')!.data as unknown as SysData;
  const card = (d: SysData, hubCard = false) => (
    <div className={'flex flex-col gap-1.5 rounded-lg border px-4 py-3.5 ' + (hubCard ? 'border-[oklch(0.75_0.12_293)] bg-accent-wash' : 'border-line bg-white')}>
      <span className="flex items-center gap-2.5 font-[650]">
        {d.logo ? <img src={d.logo} alt="" className="block h-4 w-auto" /> : null}
        {d.name}
      </span>
      <span className="text-sm text-ink-5">{d.role}</span>
      {d.meta ? <span className="text-sm font-[550]">{d.meta}</span> : null}
      {d.metaLines ? <span className="text-sm font-[550]">{d.metaLines.map(m => m.text).join(', ')}</span> : null}
      {d.sync ? <span className="flex items-center gap-2 text-sm text-muted"><span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.14_155)]" />{d.sync}</span> : null}
    </div>
  );
  const group = (i: number, items: typeof sys) => (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5"><span className="font-[650]">{labels[i]?.label}</span><span className="text-sm text-muted">{labels[i]?.note}</span></div>
      {items.map(n => <div key={n.id}>{card(n.data as unknown as SysData)}</div>)}
    </div>
  );
  const arrow = <div aria-hidden className="flex justify-center text-[oklch(0.55_0.17_293)]"><Icon name="arrow-down" size={18} /></div>;
  return (
    <div className="flex flex-col gap-3 px-4 py-5">
      {group(0, sys.filter(n => n.position.x < 0))}
      {arrow}
      {card(hub, true)}
      {arrow}
      {group(1, sys.filter(n => n.position.x > 0))}
    </div>
  );
}

/** Tooltips on the first and last bars open inwards so they stay inside the chart. */
const tipAlign = (i: number, n: number) => (i < 3 ? 'start' : i > n - 4 ? 'end' : undefined);

/** The numbers behind a chart, for screen readers. */
function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead><tr>{head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, k) => (k ? <td key={k}>{c}</td> : <th key={k} scope="row">{c}</th>))}</tr>)}</tbody>
    </table>
  );
}

type ActiveRow = ReturnType<typeof computeInsights>['activeD'][number];

function ActiveList({ title, sub, rows, idW }: { title: string; sub: string; rows: ActiveRow[]; idW: number }) {
  const { contentW } = useShell();
  const compact = contentW > 0 && contentW < 760;
  const cols = compact ? `${idW}px minmax(0,1fr) 64px` : `56px ${idW}px minmax(0,1fr) 172px 150px`;
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-7">
      <SectionTitle title={title} sub={sub} />
      <div className="flex flex-col">
        {rows.length ? rows.map(a => (
          <Clickable key={a.id} href={a.href} className="row-link grid items-center gap-4 border-b border-line-soft py-2.5 last:border-b-0" style={{ gridTemplateColumns: cols }}>
            {!compact ? <Thumb th={a.th} /> : null}
            <span className="flex items-center gap-2 font-mono text-sm whitespace-nowrap text-muted"><Icon name={a.icon} size={14} color={a.fg} />{a.id}</span>
            <div className="flex min-w-0 flex-col gap-[3px]"><span className="bui-trunc font-[550]">{a.title}</span><span className="bui-trunc text-sm text-muted">{a.meta}</span></div>
            <div title={a.sparkTip} className="flex items-end justify-end gap-3">
              {!compact ? (
                <div aria-hidden className="flex h-6 w-24 items-end gap-0.5">
                  {a.spark.map((sp, i) => <span key={i} className="min-w-0 flex-1 rounded-[1px]" style={{ height: sp.h, background: sp.c }} />)}
                </div>
              ) : null}
              <div className="flex min-w-[52px] flex-col items-end leading-[1.15]">
                <span className="text-lg font-bold tabular-nums">{a.n}</span>
                <span className="text-[13px] text-muted">{a.nL}</span>
              </div>
            </div>
            {!compact ? <PeopleStack people={a.people} more={a.more} moreTip={a.moreTip} label={a.peopleL} /> : null}
          </Clickable>
        )) : <span className="py-6 text-muted">No activity in this period.</span>}
      </div>
    </section>
  );
}
