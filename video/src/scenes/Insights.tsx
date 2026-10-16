import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { camAt, frame as framed, pad, rectToScreen, toScreen } from '../components/camera';
import { FeatureFrame } from '../components/FeatureFrame';
import { Spotlight, window01 } from '../components/Overlays';
import { Pointer, pointerAt } from '../components/Pointer';
import { Screen } from '../components/Screen';
import { cap, L } from '../layout';

const I = L.insights;
const RANGE_Y = I.range.y + I.range.h / 2 - 6;
// Range buttons, measured off the stats captures.
const BTN = { d7: 1185, d30: 1283, d90: 1382, m6: 1486 };
const CLICKS = [104, 122, 140, 158];

export const Insights: React.FC = () => {
  const f = useCurrentFrame();
  const statsScroll = I.range.y - 60;
  const kpis = pad({ x: I.range.x, y: I.range.y, w: I.range.w, h: I.stats.y + I.stats.h - I.range.y }, 30, 20);
  const cam = camAt(f, [
    { at: 0, scroll: 0, zoom: 1, fx: 800, fy: 450 },
    { at: 34 },
    { at: 74, scroll: statsScroll },
    { at: 94, ...framed(kpis, statsScroll, 20) },
    { at: 166 },
    { at: 188, ...framed(I.severity, I.severity.y - 120, 30) },
    { at: 206 },
    { at: 232, scroll: I.turnaround.y - 70, zoom: 1, fx: 800, fy: 450 }
  ]);

  const which = f >= CLICKS[3] ? null : f >= CLICKS[2] ? '6m' : f >= CLICKS[1] ? '90d' : f >= CLICKS[0] ? '7d' : null;
  const stats = (k: '7d' | '90d' | '6m') => {
    const r = I[`insights-stats-${k}` as const];
    return <Img key={k} src={staticFile(cap(`insights-stats-${k}`))} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, opacity: which === k ? 1 : 0 }} />;
  };

  const ptr = pointerAt(f, [
    { at: 92, x: 1300, y: 1560 },
    { at: 102, x: BTN.d7, y: RANGE_Y },
    { at: 116, x: BTN.d7, y: RANGE_Y },
    { at: 121, x: BTN.d90, y: RANGE_Y },
    { at: 134, x: BTN.d90, y: RANGE_Y },
    { at: 139, x: BTN.m6, y: RANGE_Y },
    { at: 152, x: BTN.m6, y: RANGE_Y },
    { at: 157, x: BTN.d30, y: RANGE_Y },
    { at: 176, x: 1350, y: 1720 }
  ]);
  const p = toScreen(cam, ptr.x, ptr.y);
  const ptrOpacity = Math.min(interpolate(f, [90, 98], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), interpolate(f, [168, 178], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <FeatureFrame
      index="01"
      label="Insights"
      title="Every team against its targets"
      windowTitle="Insights - DRS"
      chips={[
        { label: 'Team KPIs', on: [96, 166] },
        { label: 'Severity targets', on: [176, 210] },
        { label: 'Review turnaround', on: [214, 260] }
      ]}
    >
      <Screen
        cam={cam}
        sidebar={cap('insights-top')}
        shots={[{ src: cap('insights-full'), on: true }]}
        overlay={
          <>
            <Spotlight r={rectToScreen(cam, I.severity)} p={window01(f, 190, 214)} label="Respond and resolve on time, by severity" below dim={0.18} />
            <Pointer x={p.x} y={p.y} frame={f} clicks={CLICKS} opacity={ptrOpacity} />
          </>
        }
      >
        {stats('7d')}
        {stats('90d')}
        {stats('6m')}
      </Screen>
    </FeatureFrame>
  );
};
