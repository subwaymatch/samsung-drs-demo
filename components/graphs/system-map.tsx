import { useMemo } from 'react';
import { SYSG } from '@/lib/constants';
import { systemGraph } from '@/lib/relations';
import { useApp } from '@/lib/store';
import { cx } from '@/lib/cx';
import { useShell } from '../shell/shell-context';
import { Icon } from '../ui/icon';
import { RelGraph } from './rel-graph';
import s from './system-map.module.css';

type Graph = ReturnType<typeof systemGraph>;
type SysData = { name: string; role: string; logo?: string; sync?: string; meta?: string; href?: string };

/**
 * The seven systems DRS links: the legacy ones on the left, the new ones on the right, DRS between them.
 * A React Flow diagram where there is room for it, a stacked list on narrow screens.
 */
export function SystemMap() {
  const app = useApp();
  const { contentW } = useShell();
  const data = app?.data;
  const graph = useMemo(() => (data ? systemGraph(data) : null), [data]);
  if (!graph) return <div className={s.placeholder} />;
  return (
    <section className={s.map} aria-label="Connected systems">
      {contentW > 0 && contentW < 840 ? <SystemList graph={graph} /> : <RelGraph nodes={graph.nodes} edges={graph.edges} height={graph.height} plain />}
    </section>
  );
}

/** The seven-system diagram as a list, for phones: legacy systems, DRS, then the new systems. */
function SystemList({ graph }: { graph: Graph }) {
  const sys = graph.nodes.filter(n => n.type === 'sys' && n.id !== 'hub');
  const hub = graph.nodes.find(n => n.id === 'hub')!.data as unknown as SysData;
  const card = (d: SysData, hubCard = false) => (
    <div className={cx(s.card, hubCard && s.cardHub)}>
      <span className={s.name}>
        {d.logo ? <img src={d.logo} alt="" className={s.logo} /> : null}
        {d.name}
      </span>
      <span className={s.role}>{d.role}</span>
      {d.meta ? <span>{d.meta}</span> : null}
      {d.sync ? <span className={s.sync}><span className={s.syncDot} />{d.sync}</span> : null}
    </div>
  );
  const group = (i: number, items: typeof sys) => (
    <div className={s.group}>
      <div className={s.groupHead}><span className={s.groupTitle}>{SYSG[i].label}</span><span className={s.role}>{SYSG[i].note}</span></div>
      {items.map(n => <div key={n.id}>{card(n.data as unknown as SysData)}</div>)}
    </div>
  );
  const arrow = <div aria-hidden className={s.arrow}><Icon name="arrow-down" size={18} /></div>;
  return (
    <div className={s.list}>
      {group(0, sys.filter(n => n.position.x < 0))}
      {arrow}
      {card(hub, true)}
      {arrow}
      {group(1, sys.filter(n => n.position.x > 0))}
    </div>
  );
}
