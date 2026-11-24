import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import type { GraphEdge, GraphNode } from '@/lib/relations';
import s from './rel-graph.module.css';

const hidden = { opacity: 0, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0, background: 'transparent' };
const SIDES = ['Left', 'Right', 'Top', 'Bottom'] as const;
/**
 * Invisible handles on every side, so edges can attach wherever the layout needs. Unwrapped, so they stay out of the card's flex gap.
 * `y` moves the left and right handles from the middle to that many px from the top, and 8px out, so a line stops short of the text.
 */
const Handles = ({ y }: { y?: number }) => (
  <>
    {SIDES.map(p => {
      const style = y !== undefined && (p === 'Left' || p === 'Right') ? { ...hidden, top: y, [p === 'Left' ? 'left' : 'right']: -8 } : hidden;
      return (
        <Fragment key={p}>
          <Handle id={'s' + p} type="source" position={Position[p]} style={style} isConnectable={false} />
          <Handle id={'t' + p} type="target" position={Position[p]} style={style} isConnectable={false} />
        </Fragment>
      );
    })}
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

/**
 * A connected system, as plain text: no box, so the lines carry the structure.
 * Only the hub (DRS) gets an outline. Every line is 14px; weight and color set
 * the hierarchy. `side: 'start'` right-aligns a left-hand column, so text on
 * both sides faces the hub and each edge meets the text it belongs to.
 */
function SysNode({ data }: NodeProps<Node<D>>) {
  const hub = !!data.hub;
  return (
    <div className={cx(s.sys, hub && s.sysHub, data.side === 'start' && s.toEnd, !!data.href && s.sysLink)} style={{ width: Number(data.w) || 240 }}>
      <Handles y={data.nameY === undefined ? undefined : Number(data.nameY)} />
      <span className={s.sysName}>
        {data.logo ? <img src={str(data.logo)} alt="" className={s.sysLogo} /> : null}
        {str(data.name)}
      </span>
      <span className={s.sysRole}>{str(data.role)}</span>
      {data.sync ? (
        <span className={s.sysSync}>
          <span className={s.sysSyncDot} />
          {str(data.sync)}
        </span>
      ) : null}
    </div>
  );
}

const nodeTypes = { card: CardNode, sys: SysNode };
const SOLID = { stroke: 'oklch(0.55 0.17 293)', strokeWidth: 1.5 };
const DASHED = { stroke: 'oklch(0.7 0.05 290)', strokeWidth: 1.5, strokeDasharray: '5 4' };
const LABEL = { labelStyle: { fontSize: 13, fill: 'oklch(0.4 0.02 290)' }, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 4, labelBgStyle: { fill: '#fff' } };
/** The plain variant: hairline edges and labels in the page's own 14px muted text. */
const PLAIN_EDGE = { stroke: 'oklch(0.8 0.04 293)', strokeWidth: 1.25 };
const PLAIN_LABEL = { labelStyle: { fontSize: 14, fill: 'var(--color-muted)' }, labelBgPadding: [8, 2] as [number, number], labelBgStyle: { fill: '#fff' } };

/**
 * Relationship diagram. Columns spread out to use the available width; cards are clickable.
 *
 * `plain` draws a fixed diagram for the page itself rather than a map to explore:
 * no grid, controls, panning or zoom. The outer columns line up with the edges
 * of the container, and below `minWidth` the whole diagram scales down to fit.
 * `height` is then the diagram's own height at full size.
 */
export function RelGraph({ nodes, edges, height = 540, plain = false, minWidth = 1000 }: { nodes: GraphNode[]; edges: GraphEdge[]; height?: number; plain?: boolean; minWidth?: number }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width / (plain ? 1 : 8)) * (plain ? 1 : 8);
      setCw(p => (p === w ? p : w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [plain]);

  const { laid, rfEdges, zoom } = useMemo(() => {
    const PAD = 32, wOf = (n: GraphNode) => n.data.w || 210;
    let laid: GraphNode[] = nodes, zoom = 1;
    if (cw && nodes.length > 1) {
      const l = nodes.reduce((a, n) => (n.position.x < a.position.x ? n : a));
      const r = nodes.reduce((a, n) => (n.position.x + wOf(n) > a.position.x + wOf(a) ? n : a));
      const cl = l.position.x + wOf(l) / 2, cr = r.position.x + wOf(r) / 2;
      if (plain) {
        // Lay out at a width of at least minWidth, then zoom out to the container.
        const lw = Math.max(cw, minWidth), tl = wOf(l) / 2, tr = lw - wOf(r) / 2;
        const k = cr > cl ? (tr - tl) / (cr - cl) : 1, y0 = Math.min(...nodes.map(n => n.position.y));
        zoom = cw / lw;
        laid = nodes.map(n => ({ ...n, draggable: false, position: { x: tl + (n.position.x + wOf(n) / 2 - cl) * k - wOf(n) / 2, y: n.position.y - y0 } }));
      } else {
        const k = cr > cl ? Math.min(2.4, Math.max(1, (cw - 2 * PAD - wOf(l) / 2 - wOf(r) / 2) / (cr - cl))) : 1;
        if (k > 1) laid = nodes.map(n => {
          const c = n.position.x + wOf(n) / 2;
          return { ...n, position: { x: cl + (c - cl) * k - wOf(n) / 2, y: n.position.y } };
        });
      }
    }
    const rfEdges: Edge[] = edges.map(e => ({
      id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, animated: e.animated,
      label: e.label,
      style: plain ? PLAIN_EDGE : e.dashed ? DASHED : SOLID,
      ...(e.label ? (plain ? PLAIN_LABEL : LABEL) : {})
    }));
    return { laid, rfEdges, zoom };
  }, [nodes, edges, cw, plain, minWidth]);

  const sig = nodes.map(n => n.id + ':' + str(n.data.status) + ':' + str(n.data.meta)).join('|') + '#' + edges.length + '@' + cw;
  // On phones, show the whole diagram (small) rather than a readable crop.
  const small = cw > 0 && cw < 600;
  const h = plain ? (cw ? Math.round(height * zoom) : height) : small ? Math.min(height, 460) : height;
  const view = plain
    ? { defaultViewport: { x: 0, y: 0, zoom }, minZoom: zoom, maxZoom: zoom, panOnDrag: false, zoomOnPinch: false, zoomOnDoubleClick: false, nodesDraggable: false }
    : { fitView: true, fitViewOptions: { padding: Math.min(0.1, 24 / cw), minZoom: small ? 0.2 : 0.5, maxZoom: 1 }, minZoom: 0.2, maxZoom: 1.6 };
  return (
    <div ref={ref} className={cx(plain && s.plain)} style={{ height: h, width: '100%' }}>
      {cw ? (
        <ReactFlow
          key={sig}
          defaultNodes={laid as Node[]}
          defaultEdges={rfEdges}
          nodeTypes={nodeTypes}
          {...view}
          nodesConnectable={false}
          elementsSelectable={false}
          attributionPosition={plain ? 'bottom-right' : 'bottom-left'}
          zoomOnScroll={false}
          preventScrolling={false}
          onNodeClick={(_, n) => {
            const href = (n.data as D).href;
            if (href) navigate(String(href));
          }}
        >
          {plain ? null : (
            <>
              <Background gap={20} size={1} color="oklch(0.88 0.01 290)" />
              <Controls showInteractive={false} position="bottom-right" />
            </>
          )}
        </ReactFlow>
      ) : (
        <div className={s.loading}>Loading map...</div>
      )}
    </div>
  );
}
