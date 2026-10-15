'use client';

import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { GraphEdge, GraphNode } from '@/lib/relations';
import { Icon } from '../ui/icon';

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
const s = (v: unknown) => (v == null ? '' : String(v));

function CardNode({ data }: NodeProps<Node<D>>) {
  const c = !!data.center;
  return (
    <div
      title={s(data.tip)}
      className="flex flex-col gap-1 rounded-md px-3 py-2.5 text-ink"
      style={{
        width: Number(data.w) || 220,
        background: c ? 'oklch(0.975 0.018 293)' : '#fff',
        border: `${c ? 2 : 1}px ${data.dashed ? 'dashed' : 'solid'} ${c ? 'oklch(0.55 0.19 293)' : 'oklch(0.88 0.012 290)'}`,
        cursor: data.href ? 'pointer' : 'default',
        boxShadow: c ? '0 4px 14px oklch(0.5 0.12 293 / 0.14)' : '0 1px 2px oklch(0.3 0.02 290 / 0.06)'
      }}
    >
      <Handles />
      <div className="flex items-center justify-between gap-2">
        <span className="rounded px-2 py-px text-[13px] font-semibold whitespace-nowrap" style={{ color: s(data.kc), background: s(data.kb) }}>{s(data.kind)}</span>
        {data.status ? <span className="text-sm font-[550] whitespace-nowrap" style={{ color: s(data.sfg) }}>{s(data.status)}</span> : null}
      </div>
      <span className="font-mono text-sm text-ink-5">{s(data.id)}</span>
      {data.title ? <span className="line-clamp-2 text-sm leading-[1.4]">{s(data.title)}</span> : null}
    </div>
  );
}

function SysNode({ data }: NodeProps<Node<D>>) {
  const hub = !!data.hub;
  const lines = (data.metaLines as { icon: string; text: string }[] | undefined) || [];
  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg text-ink"
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
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {data.logo ? <img src={s(data.logo)} alt="" className="block flex-none object-contain object-left" style={{ width: hub ? 30 : 28, height: hub ? 26 : 16 }} /> : null}
        <span className="font-[650]" style={{ fontSize: hub ? 16 : 14 }}>{s(data.name)}</span>
      </div>
      <span className="text-sm leading-[1.4] text-muted">{s(data.role)}</span>
      {data.meta ? <span className="text-sm font-semibold tabular-nums" style={{ color: hub ? 'oklch(0.42 0.17 293)' : 'oklch(0.3 0.02 290)' }}>{s(data.meta)}</span> : null}
      {lines.length ? (
        <div className="my-1.5 flex flex-col gap-1.5">
          {lines.map(m => (
            <span key={m.text} className="flex items-center gap-2 text-sm font-semibold text-accent-ink tabular-nums">
              <Icon name={m.icon} size={15} color="oklch(0.5 0.17 293)" />
              {m.text}
            </span>
          ))}
        </div>
      ) : null}
      {data.sync ? (
        <span className="flex items-center gap-1.5 text-sm text-ink-5">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-[oklch(0.62_0.14_155)]" />
          {s(data.sync)}
        </span>
      ) : null}
    </div>
  );
}

function LabelNode({ data }: NodeProps<Node<D>>) {
  return (
    <div className="flex flex-col gap-0.5" style={{ width: Number(data.w) || 210 }}>
      <span className="text-sm font-[650] text-ink-2">{s(data.label)}</span>
      {data.note ? <span className="text-sm text-muted">{s(data.note)}</span> : null}
    </div>
  );
}

const nodeTypes = { card: CardNode, sys: SysNode, label: LabelNode };
const SOLID = { stroke: 'oklch(0.55 0.17 293)', strokeWidth: 1.5 };
const DASHED = { stroke: 'oklch(0.7 0.05 290)', strokeWidth: 1.5, strokeDasharray: '5 4' };
const LABEL = { labelStyle: { fontSize: 13, fill: 'oklch(0.4 0.02 290)' }, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 4, labelBgStyle: { fill: '#fff' } };

/** Relationship diagram. Columns spread out to use the available width; cards are clickable. */
export function RelGraph({ nodes, edges, height = 540 }: { nodes: GraphNode[]; edges: GraphEdge[]; height?: number }) {
  const router = useRouter();
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

  const sig = nodes.map(n => n.id + ':' + s(n.data.status) + ':' + s(n.data.meta)).join('|') + '#' + edges.length + '@' + cw;
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
            if (href) router.push(String(href));
          }}
        >
          <Background gap={20} size={1} color="oklch(0.88 0.01 290)" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted">Loading map...</div>
      )}
    </div>
  );
}
