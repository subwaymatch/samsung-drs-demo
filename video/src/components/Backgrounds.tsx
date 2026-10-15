import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../theme';

const Glow: React.FC<{ x: number; y: number; size: number; color: string }> = ({ x, y, size, color }) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`
    }}
  />
);

/** Light canvas with the dotted grid of the app's React Flow diagrams and two slow glows. */
export const CanvasBg: React.FC = () => {
  const f = useCurrentFrame();
  const drift = f * 0.22;
  return (
    <AbsoluteFill style={{ background: C.canvas, overflow: 'hidden' }}>
      <Glow x={1500 + Math.sin(f / 110) * 120} y={160 + Math.cos(f / 130) * 80} size={1500} color="oklch(0.86 0.09 293 / 0.55)" />
      <Glow x={260 + Math.cos(f / 120) * 120} y={980 + Math.sin(f / 100) * 60} size={1300} color="oklch(0.9 0.06 250 / 0.5)" />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(oklch(0.45 0.06 293 / 0.2) 1.3px, transparent 1.7px)',
          backgroundSize: '30px 30px',
          backgroundPosition: `${drift}px ${drift * 0.35}px`,
          maskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 45%, black 20%, transparent 100%)'
        }}
      />
    </AbsoluteFill>
  );
};

/** Deep violet stage for the opening and closing titles. */
export const NightBg: React.FC<{ frameOffset?: number }> = ({ frameOffset = 0 }) => {
  const f = useCurrentFrame() + frameOffset;
  const drift = f * 0.25;
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <Glow x={960 + Math.sin(f / 70) * 160} y={420 + Math.cos(f / 90) * 60} size={1600} color="oklch(0.45 0.2 293 / 0.55)" />
      <Glow x={300 + Math.cos(f / 80) * 100} y={1000} size={1200} color="oklch(0.42 0.14 255 / 0.35)" />
      <Glow x={1700} y={80 + Math.sin(f / 60) * 40} size={900} color="oklch(0.5 0.2 320 / 0.25)" />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(oklch(1 0 0 / 0.12) 1.2px, transparent 1.6px)',
          backgroundSize: '30px 30px',
          backgroundPosition: `${drift}px ${drift * 0.35}px`,
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, black 10%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 45%, black 10%, transparent 100%)'
        }}
      />
    </AbsoluteFill>
  );
};
