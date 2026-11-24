import { useNavigate } from 'react-router';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fFull, TNOW } from '@/lib/dates';
import { computeInsights, RANGES } from '@/lib/insights';
import { useApp } from '@/lib/store';
import { Illustration, Loading, PageHeader, Section, SectionTitle, Thumb } from '../common/basics';
import { Clickable } from '../common/clickable';
import { useShell } from '../shell/shell-context';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { PeopleStack, Person } from '../ui/person';
import { cx } from '@/lib/cx';
import s from './insights-view.module.css';

const KPI_GRID = { gridTemplateColumns: 'repeat(auto-fit,minmax(clamp(calc((100% - 72px) / 4),(900px - 100%) * 999,clamp(calc((100% - 24px) / 2),(440px - 100%) * 999,100%)),1fr))' };

function Bar({ w, c, h = 6 }: { w: string; c: string; h?: number }) {
  return (
    <span className={s.bar} style={{ height: h }}>
      <span className={s.barFill} style={{ width: w, background: c }} />
    </span>
  );
}

export function InsightsView() {
  const app = useApp();
  const navigate = useNavigate();
  const { ui, setUi } = useShell();
  const range = RANGES.some(r => r.n === ui.range) ? ui.range : 30;
  const data = app?.data;
  const st = useMemo(() => (data ? computeInsights(data, range) : null), [data, range]);
  if (!app || !st) return <Loading />;
  const compMore = st.byComp.length > 6, compOpen = ui.compOpen;

  return (
    <div className={s.page}>
      <PageHeader
        title="Insights"
        action={<span className={s.status}>Data through {fFull(TNOW)}, {TNOW.slice(11)}</span>}
      />

      <div className={s.twoUp}>
        <Section title="Defects by migration state" sub={st.mig.sub}>
          <MigrationDonut mig={st.mig} />
        </Section>

        <Section
          title="Migration by component"
          sub="Components move to Jira in waves"
          right={
            <div className={s.migLegend}>
              {st.mig.states.map(ms => (
                <span key={ms.k} className={s.migLegendItem}><span className={s.migSwatch} style={{ background: ms.c }} />{ms.label}</span>
              ))}
            </div>
          }
        >
          <div className={s.compBlock}>
            <div id="comp-list" className={s.compList} style={{ maxHeight: compOpen || !compMore ? 'none' : 300 }}>
              <div className={s.compRows}>
                {st.byComp.map(m => (
                  <div key={m.comp} className={s.compRow}>
                    <Clickable href={m.href} className={s.compName}>
                      <span className="bui-trunc">{m.comp}</span>
                      <span className={s.sub}>{m.wave}</span>
                    </Clickable>
                    <div className={s.compBar} style={{ width: m.w }}>
                      {m.segs.map(seg => <Clickable key={seg.tip} href={seg.href} title={seg.tip} className={s.compSeg} style={{ flex: seg.n, background: seg.c }} />)}
                    </div>
                    <span className={s.rowValue}>{m.total}</span>
                  </div>
                ))}
              </div>
              {compMore && !compOpen ? <div className={s.compFade} /> : null}
            </div>
            {compMore ? (
              <div className={s.compMore}>
                <Button variant="ghost" size="sm" icon={compOpen ? 'chevron-up' : 'chevron-down'} ariaExpanded={compOpen} ariaControls="comp-list" onClick={() => setUi({ compOpen: !compOpen })}>
                  {compOpen ? 'Show fewer' : `Show all ${st.byComp.length} components`}
                </Button>
              </div>
            ) : null}
          </div>
        </Section>
      </div>

      <div className={s.periodBar} style={{ top: 'var(--topbar-h, 0px)' }}>
        <div className={s.periodShowing}>
          <span>Showing</span>
          <span className={s.periodLabel}>{st.periodL}</span>
        </div>
        <div role="tablist" aria-label="Reporting period" className={s.periodTabs}>
          {RANGES.map(r => {
            const on = r.n === range;
            return (
              <button
                key={r.n}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setUi({ range: r.n })}
                className={s.periodTab}
                style={{ borderBottomColor: on ? 'var(--color-accent)' : 'transparent', color: on ? 'var(--color-accent-ink)' : 'var(--color-ink-5)', fontWeight: on ? 600 : 500 }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={s.kpis} style={KPI_GRID}>
        {st.kpis.map(k => (
          <Clickable key={k.label} href={k.href} className={s.kpi}>
            <Illustration name={k.art} height={56} className={s.kpiArt} />
            <span className={s.kpiLabel}>{k.label}</span>
            <div className={s.kpiValueRow}>
              <span className={s.kpiValue}>{k.value}</span>
              <span className={s.kpiUnit}>{k.unit}</span>
            </div>
            <span className={s.kpiDelta} style={{ color: k.dc }}>{k.delta}</span>
          </Clickable>
        ))}
      </div>

      <Section title="Severity targets" sub={st.tgSub} gap={12}>
        <div className={s.tableScroll}>
          <div className={s.tgTable}>
            <div className={s.tgHead}>
              <span>Severity</span><span>Respond within</span><span>Responded on time</span><span>Resolve within</span><span>Resolved on time</span><span className={s.numHead}>Open past target</span>
            </div>
            {st.tg.map(t => (
              <Clickable key={t.k} href={t.href} className={cx('row-link', s.tgRow)}>
                <span className={s.tgSeverity}><Icon name={t.icon} color={t.c} size={16} />{t.l}</span>
                <span>{t.rl}</span>
                <span className={s.barCell}><Bar w={t.rw} c={t.rc} /><span className={s.barPct}>{t.rp}</span></span>
                <span>{t.fl}</span>
                <span className={s.barCell}><Bar w={t.fw} c={t.fc} /><span className={s.barPct}>{t.fp}</span></span>
                <span className={s.rowValue} style={{ color: t.lateFg }}>{t.late}</span>
              </Clickable>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Code review turnaround"
        sub={`Median hours from submission to first review decision, ${st.bucketL}`}
        gap={24}
        right={
          <div className={s.tatLegend}>
            <span className={s.legendItem}><span className={cx(s.swatch, s.withinTarget)} />Within 48h target</span>
            <span className={s.legendItem}><span className={cx(s.swatch, s.overTarget)} />Over target</span>
          </div>
        }
      >
        <div className={s.tatChart}>
          <div className={s.tatPlot} role="group" aria-label={'Code review turnaround chart. ' + st.tatSummary}>
            {st.ticks.map(t => (
              <div key={t.l} className={s.gridLine} style={{ bottom: t.pos }}>
                <span className={s.tatTick}>{t.l}</span>
              </div>
            ))}
            <div className={s.bars} style={{ gap: st.gap }}>
              {st.tat.map((b, i) => (
                <Clickable key={i} href={b.href || undefined} tip={b.tip} tipAlign={tipAlign(i, st.tat.length)} ariaLabel={b.tip.replace('\n', ': ')} className={s.tatBar} style={{ height: b.h, background: b.c }} />
              ))}
            </div>
            <div className={s.targetLine} style={{ bottom: st.targetPos }}>
              <span className={s.targetLabel}>Target 48h</span>
            </div>
          </div>
          <div className={s.tatAxis} style={{ gap: st.gap }} aria-hidden>
            {st.tat.map((b, i) => (
              <span key={i} className={s.tatAxisLabel} style={{ justifyContent: b.ja }}>{b.label}</span>
            ))}
          </div>
          <DataTable caption="Code review turnaround" head={['Period', 'Median turnaround', 'Decisions']} rows={st.tat.map(b => [b.span, b.v, String(b.n)])} />
        </div>
      </Section>

      <div className={s.twoUp}>
        <Section
          title="Defects reported vs resolved"
          sub={st.flowSub}
          right={
            <div className={s.flowLegend}>
              <span className={s.legendItem}><span className={cx(s.swatch, s.reported)} />Reported</span>
              <span className={s.legendItem}><span className={cx(s.swatch, s.resolved)} />Resolved</span>
            </div>
          }
        >
          <div className={s.flowChart}>
            <div className={s.flowPlot} role="group" aria-label={'Defects reported vs resolved chart. ' + st.flowNote}>
              {st.flowTicks.map(t => (
                <div key={t.l} className={s.gridLine} style={{ bottom: t.pos }}>
                  <span className={s.flowTick}>{t.l}</span>
                </div>
              ))}
              <div className={s.bars} style={{ gap: st.flowGap }}>
                {st.flow.map((b, i) => (
                  <div key={i} className={s.flowPair}>
                    <Clickable href={b.href1} tip={b.tip1} tipAlign={tipAlign(i, st.flow.length)} ariaLabel={b.tip1.replace('\n', ': ')} className={cx(s.flowBar, s.reported)} style={{ height: b.h1 }} />
                    <Clickable href={b.href2} tip={b.tip2} tipAlign={tipAlign(i, st.flow.length)} ariaLabel={b.tip2.replace('\n', ': ')} className={cx(s.flowBar, s.resolved)} style={{ height: b.h2 }} />
                  </div>
                ))}
              </div>
            </div>
            <div className={s.flowAxis} style={{ gap: st.flowGap }} aria-hidden>
              {st.flow.map((b, i) => <span key={i} className={s.flowAxisLabel}>{b.label}</span>)}
            </div>
          </div>
          <span className={s.flowNote}>{st.flowNote}</span>
          <DataTable caption="Defects reported vs resolved" head={['Period', 'Reported', 'Resolved']} rows={st.flow.map(b => [b.span, String(b.rep), String(b.res)])} />
        </Section>

        <Section title="Review outcomes" sub={st.outcomeSub}>
          <div className={s.waffle} aria-hidden>
            {st.waffle.map((c, i) => <div key={i} data-tip={c.tip} data-tip-align={i % 20 < 4 ? 'start' : i % 20 > 15 ? 'end' : undefined} className={s.waffleCell} style={{ background: c.c }} />)}
          </div>
          <span className={s.sub}>Each square is 1% of submitted reviews</span>
          <div className={s.rowList}>
            {st.outcomes.map(o => (
              <Clickable key={o.k} href={o.href} className={cx('row-link', s.outcome)}>
                <span className={s.outcomeSwatch} style={{ background: o.c }} />
                <div className={s.outcomeText}><span className={s.label}>{o.label}</span><span className={s.sub}>{o.desc}</span></div>
                <span className={s.subNumber}>{o.n}</span>
                <span className={s.outcomePct}>{o.pct}</span>
              </Clickable>
            ))}
          </div>
        </Section>

        <Section
          title="Open defects by product line"
          sub="Open and in-progress defects by severity. Models in a line share a firmware base."
          right={
            <div className={s.heatLegend}>
              <span>Fewer</span><span className={s.heatScale} /><span>More</span>
            </div>
          }
        >
          <div className={s.heat}>
            <div className={s.heatHead}>
              <span />
              {st.heatCols.map(h => (
                <span key={h.l} className={s.heatCol}><Icon name={h.icon} color={h.c} size={14} />{h.l}</span>
              ))}
              <span className={s.heatTotalHead}>Total</span>
            </div>
            {st.heat.length ? st.heat.map(m => (
              <div key={m.model} className={s.heatRow}>
                <Clickable href={m.href} className={s.heatModel}>
                  <span className={cx('bui-trunc', s.label)}>{m.model}</span>
                  <span className={cx('bui-trunc', s.sub)}>{m.sub}</span>
                </Clickable>
                {m.cells.map((c, i) => (
                  <Clickable key={i} href={c.href} tip={c.tip} ariaLabel={c.tip} className={s.heatCell} style={{ background: c.bg, color: c.fg }}>
                    {c.n}
                  </Clickable>
                ))}
                <span className={s.rowValue}>{m.total}</span>
              </div>
            )) : <span className={s.empty}>No open defects</span>}
            {st.heat.length ? (
              <div className={s.heatFoot}>
                <span className={s.heatFootLabel}><span className={s.label}>Unique open defects</span><span className={s.sub}>Each defect counted once</span></span>
                {st.heatUnique.cells.map((n, i) => <span key={i} className={s.heatFootCell}>{n || '-'}</span>)}
                <span className={s.rowValue}>{st.heatUnique.total}</span>
              </div>
            ) : null}
          </div>
          {st.heatUnique.multi ? <span className={s.sub}>A defect that affects several lines is counted in each, so the rows add up to more than the unique total</span> : null}
        </Section>

        <Section title="Turnaround by change type" sub="Most common change types, median hours to first decision, dashed line is the 48h target">
          <div className={s.types}>
            {st.byType.map(t => (
              <Clickable key={t.type} href={t.href} className={cx('row-link', s.type)}>
                <div className={s.typeName}>
                  <Icon name={t.icon} size={16} color="var(--color-muted)" />
                  <div className={s.labelBlock}><span>{t.type}</span><span className={s.sub}>{t.nL}</span></div>
                </div>
                <div className={s.typeTrack}>
                  <div className={s.typeFill} style={{ width: t.w, background: t.c }} />
                  <div className={s.typeTarget} style={{ left: st.typeTarget }} />
                </div>
                <span className={s.rowValue}>{t.v}</span>
              </Clickable>
            ))}
          </div>
        </Section>
      </div>

      <div className={s.activeLists}>
        <ActiveList title="Most active defects" sub="Comments, status changes and assignments in the selected period. Ties go to the most recently active." rows={st.activeD} idW={128} />
        <ActiveList title="Most active code reviews" sub="Comments, reviewer assignments and decisions in the selected period. Ties go to the most recently active." rows={st.activeR} idW={96} />
      </div>

      <Section title="Code review team" sub="Reviewer workload and responsiveness in the selected period" gap={12}>
        <div className={s.tableScroll}>
          <div className={s.teamTable}>
            <div className={s.teamHead}>
              <span>Reviewer</span><span className={s.numHead} title="Each reviewer's first decision on a review. A review with two reviewers counts once for each.">Reviewer decisions</span><span className={s.numHead}>Median</span><span>Within 48h</span><span className={s.numHead}>In queue now</span>
            </div>
            {st.team.map(r => (
              <Clickable key={r.id} href={r.href} className={cx('row-link', s.teamRow)}>
                <span className={s.reviewer}>
                  <Person person={r.u} size={32} />
                  <span className={s.labelBlock}><span className={s.label}>{r.u.name}</span><span className={s.sub}>{r.u.title}</span></span>
                </span>
                <span className={s.numCell}>{r.n}</span>
                <span className={s.rowValue}>{r.med}</span>
                <span className={s.barCell}><Bar w={r.pctW} c={r.pc} /><span className={s.barPct}>{r.pct}</span></span>
                <span className={s.numCell}>{r.queue}</span>
              </Clickable>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

type Mig = ReturnType<typeof computeInsights>['mig'];

/**
 * The migration donut with its callouts. The callouts on the left are set against their leader lines, so how far
 * the leftmost one starts from the edge depends on its text and the chart's width. The chart is shifted by that much,
 * measured after layout and again on resize, so the leftmost callout lines up with the section heading.
 */
function MigrationDonut({ mig }: { mig: Mig }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const labels = el.getElementsByClassName(s.donutLabel);
      if (!labels.length) return;
      // Both move with the chart, so the offset does not depend on the current shift.
      const left = Math.min(...[...labels].map(l => l.getBoundingClientRect().left)) - el.getBoundingClientRect().left;
      setShift(p => (Math.abs(p - left) < 0.5 ? p : left));
    };
    measure();
    document.fonts?.ready.then(measure);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mig]);
  return (
    <div ref={ref} className={s.donut} style={{ translate: `${-shift}px 0` }}>
      <svg viewBox="0 0 520 280" role="img" aria-label="Defects by migration state" className={s.donutSvg}>
        {mig.donut.map(p => (
          <path
            key={p.label}
            d={p.d}
            fill={p.c}
            stroke="#fff"
            strokeWidth={2}
            role="link"
            tabIndex={0}
            aria-label={p.tip}
            className={s.donutSlice}
            // A press opens the slice's defects without focusing it, so no focus ring lingers after a click
            onMouseDown={e => e.preventDefault()}
            onClick={() => navigate(p.href)}
            onKeyDown={e => { if (e.key === 'Enter') navigate(p.href); }}
          >
            <title>{p.tip}</title>
          </path>
        ))}
        {mig.donut.map(p => <polyline key={'l' + p.label} points={p.lp} fill="none" stroke="oklch(0.62 0.02 290)" strokeWidth={1} />)}
        {mig.donut.map(p => <circle key={'c' + p.label} cx={p.dx} cy={p.dy} r={3} fill="oklch(0.45 0.02 290)" />)}
      </svg>
      {mig.donut.map(p => (
        <Clickable key={'t' + p.label} href={p.href} className={s.donutLabel} style={{ left: p.lx, top: p.ly, transform: p.tr, textAlign: p.ta }}>
          <span className={s.donutLabelName}>{p.label}</span>
          <span className={s.subNumber}>{p.val}</span>
        </Clickable>
      ))}
      <div className={s.donutCenter}>
        <span className={s.donutTotal}>{mig.total}</span>
        <span className={s.sub}>defects</span>
      </div>
    </div>
  );
}

/** Tooltips on the first and last bars open inwards so they stay inside the chart. */
const tipAlign = (i: number, n: number) => (i < 3 ? 'start' : i > n - 4 ? 'end' : undefined);

/** The numbers behind a chart, for screen readers. */
function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <table className="visually-hidden">
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
    <section className={s.active}>
      <SectionTitle title={title} sub={sub} />
      <div className={s.rowList}>
        {rows.length ? rows.map(a => (
          <Clickable key={a.id} href={a.href} className={cx('row-link', s.activeRow)} style={{ gridTemplateColumns: cols }}>
            {!compact ? <Thumb th={a.th} /> : null}
            <span className={s.activeId}><Icon name={a.icon} size={14} color={a.fg} />{a.id}</span>
            <div className={s.activeText}><span className={cx('bui-trunc', s.label)}>{a.title}</span><span className={cx('bui-trunc', s.sub)}>{a.meta}</span></div>
            <div title={a.sparkTip} className={s.activeCount}>
              {!compact ? (
                <div aria-hidden className={s.spark}>
                  {a.spark.map((sp, i) => <span key={i} className={s.sparkBar} style={{ height: sp.h, background: sp.c }} />)}
                </div>
              ) : null}
              <div className={s.activeN}>
                <span className={s.activeNum}>{a.n}</span>
                <span className={s.activeUnit}>{a.nL}</span>
              </div>
            </div>
            {!compact ? <PeopleStack people={a.people} more={a.more} moreTip={a.moreTip} label={a.peopleL} /> : null}
          </Clickable>
        )) : <span className={s.empty}>No activity in this period</span>}
      </div>
    </section>
  );
}
