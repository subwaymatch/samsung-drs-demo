import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { GraphEdge, GraphNode } from '@/lib/relations';
import { Icon } from '../ui/icon';
import s from './rel-graph.module.css';

const hidden = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0, background: 'transparent' };
const SIDES = ['Left', 'Right', 'Top', 'Bottom'] as const;
/** Invisible handles on every side, so edges can attach wherever the layout needs. Unwrapped, so they stay out of the card's flex gap. */
const Handles = () => (
  <>
    {SIDES.map(p => (
      <Fragment key={p}>
        <Handle id={'s' + p} type="source" position={Position[p]} style={hidden} isConnectable={false} />
        <Handle id={'t' + p} type="target" position={Position[p]} style={hidden} isConnectable={false} />
      </Fragment>
    ))}
  </>
);

type D = Record<string, unknown>;
const str = (v: unknown) => (v == null ? '' : String(v));

function CardNode({ data }: NodeProps<Node<D>>) {
  const c = !!data.center;
  return (
    <div
      title={str(data.tip)}
      className={s.card}
      style={{
        width: Number(data.w) || 220,
        background: c ? 'oklch(0.975 0.018 293)' : '#fff',
        border: `${c ? 2 : 1}px ${data.dashed ? 'dashed' : 'solid'} ${c ? 'oklch(0.55 0.19 293)' : 'oklch(0.88 0.012 290)'}`,
        cursor: data.href ? 'pointer' : 'default',
        boxShadow: c ? '0 4px 14px oklch(0.5 0.12 293 / 0.14)' : '0 1px 2px oklch(0.3 0.02 290 / 0.06)'
      }}
    >
      <Handles />
      <div className={s.cardHead}>
        <span className={s.cardKind} style={{ color: str(data.kc), background: str(data.kb) }}>{str(data.kind)}</span>
        {data.status ? <span className={s.cardStatus} style={{ color: str(data.sfg) }}>{str(data.status)}</span> : null}
      </div>
      <span className={s.cardId}>{str(data.id)}</span>
      {data.title ? <span className={s.cardTitle}>{str(data.title)}</span> : null}
    </div>
  );
}

function SysNode({ data }: NodeProps<Node<D>>) {
  const hub = !!data.hub;
  const lines = (data.metaLines as { icon: string; text: string }[] | undefined) || [];
  return (
    <div
      className={s.sys}
      style={{
        width: Number(data.w) || 210,
        padding: hub ? '16px 18px' : '12px 14px',
        background: hub ? 'oklch(0.975 0.018 293)' : '#fff',
        border: hub ? '2px solid oklch(0.55 0.19 293)' : '1px solid oklch(0.88 0.012 290)',
        cursor: data.href ? 'pointer' : 'default',
        boxShadow: hub ? '0 6px 20px oklch(0.5 0.12 293 / 0.16)' : '0 1px 2px oklch(0.3 0.02 290 / 0.06)'
      }}
    >
      <Handles />
      <div className={s.sysHead}>
        {data.logo ? <img src={str(data.logo)} alt="" className={s.sysLogo} style={{ width: hub ? 30 : 28, height: hub ? 26 : 16 }} /> : null}
        <span className={s.sysName} style={{ fontSize: hub ? 16 : 14 }}>{str(data.name)}</span>
      </div>
      <span className={s.sysRole}>{str(data.role)}</span>
      {data.meta ? <span className={s.sysMeta} style={{ color: hub ? 'oklch(0.42 0.17 293)' : 'oklch(0.3 0.02 290)' }}>{str(data.meta)}</span> : null}
      {lines.length ? (
        <div className={s.sysMetaLines}>
          {lines.map(m => (
            <span key={m.text} className={s.sysMetaLine}>
              <Icon name={m.icon} size={15} color="oklch(0.5 0.17 293)" />
              {m.text}
            </span>
          ))}
        </div>
      ) : null}
      {data.sync ? (
        <span className={s.sysSync}>
          <span className={s.sysSyncDot} />
          {str(data.sync)}
        </span>
      ) : null}
    </div>
  );
}

function LabelNode({ data }: NodeProps<Node<D>>) {
  return (
    <div className={s.label} style={{ width: Number(data.w) || 210 }}>
      <span className={s.labelTitle}>{str(data.label)}</span>
      {data.note ? <span className={s.labelNote}>{str(data.note)}</span> : null}
    </div>
  );
}

const nodeTypes = { card: CardNode, sys: SysNode, label: LabelNode };
const SOLID = { stroke: 'oklch(0.55 0.17 293)', strokeWidth: 1.5 };
const DASHED = { stroke: 'oklch(0.7 0.05 290)', strokeWidth: 1.5, strokeDasharray: '5 4' };
const LABEL = { labelStyle: { fontSize: 13, fill: 'oklch(0.4 0.02 290)' }, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 4, labelBgStyle: { fill: '#fff' } };

/** Relationship diagram. Columns spread out to use the available width; cards are clickable. */
export function RelGraph({ nodes, edges, height = 540 }: { nodes: GraphNode[]; edges: GraphEdge[]; height?: number }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width / 8) * 8;
      setCw(p => (p === w ? p : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { laid, rfEdges } = useMemo(() => {
    const PAD = 32, wOf = (n: GraphNode) => n.data.w || 210;
    let laid: GraphNode[] = nodes;
    if (cw && nodes.length > 1) {
      const l = nodes.reduce((a, n) => (n.position.x < a.position.x ? n : a));
      const r = nodes.reduce((a, n) => (n.position.x + wOf(n) > a.position.x + wOf(a) ? n : a));
      const cl = l.position.x + wOf(l) / 2, cr = r.position.x + wOf(r) / 2;
      const k = cr > cl ? Math.min(2.4, Math.max(1, (cw - 2 * PAD - wOf(l) / 2 - wOf(r) / 2) / (cr - cl))) : 1;
      if (k > 1) laid = nodes.map(n => {
        const c = n.position.x + wOf(n) / 2;
        return { ...n, position: { x: cl + (c - cl) * k - wOf(n) / 2, y: n.position.y } };
      });
    }
    const rfEdges: Edge[] = edges.map(e => ({
      id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, animated: e.animated,
      label: e.label, style: e.dashed ? DASHED : SOLID, ...(e.label ? LABEL : {})
    }));
    return { laid, rfEdges };
  }, [nodes, edges, cw]);

  const sig = nodes.map(n => n.id + ':' + str(n.data.status) + ':' + str(n.data.meta)).join('|') + '#' + edges.length + '@' + cw;
  // On phones, show the whole diagram (small) rather than a readable crop.
  const small = cw > 0 && cw < 600;
  return (
    <div ref={ref} style={{ height: small ? Math.min(height, 460) : height, width: '100%' }}>
      {cw ? (
        <ReactFlow
          key={sig}
          defaultNodes={laid as Node[]}
          defaultEdges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: Math.min(0.1, 24 / cw), minZoom: small ? 0.2 : 0.5, maxZoom: 1 }}
          nodesConnectable={false}
          elementsSelectable={false}
          attributionPosition="bottom-left"
          zoomOnScroll={false}
          preventScrolling={false}
          minZoom={0.2}
          maxZoom={1.6}
          onNodeClick={(_, n) => {
            const href = (n.data as D).href;
            if (href) navigate(String(href));
          }}
        >
          <Background gap={20} size={1} color="oklch(0.88 0.01 290)" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      ) : (
        <div className={s.loading}>Loading map...</div>
      )}
    </div>
  );
}
