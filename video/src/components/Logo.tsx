import React, { useId } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';

// The DRS mark from components/shell/logo.tsx: three stacked layers, like sheets
// coming out of a printer.
const SHAPE =
  'M44 1C51 1 57 2 61 6L86.2 43.5C87.2 45 87.3 47 86.6 48.5L76.5 71.5C75.6 73.5 73.6 74.5 71.6 73.9C53.5 66.5 34.5 66.5 16.4 73.9C14.4 74.5 12.4 73.5 11.5 71.5L1.4 48.5C0.7 47 0.8 45 1.8 43.5L27 6C31 2 37 1 44 1Z';

type Props = {
  size: number;
  /** Frame (relative to the parent sequence) the animation starts on. */
  delay?: number;
  /** Draw the finished mark without animating. */
  still?: boolean;
  glint?: boolean;
  style?: React.CSSProperties;
};

/**
 * Animated DRS mark: the back sheet pops in, the two front sheets feed up into
 * place one after the other, then a highlight sweeps across.
 */
export const DrsMark: React.FC<Props> = ({ size, delay = 0, still = false, glint = true, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = 'drs' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = still ? 1e4 : frame - delay;

  const base = spring({ frame: f, fps, config: { damping: 12, mass: 0.7, stiffness: 120 } });
  const s2 = spring({ frame: f - 8, fps, config: { damping: 14, stiffness: 150 } });
  const s3 = spring({ frame: f - 15, fps, config: { damping: 14, stiffness: 150 } });
  const y2 = interpolate(s2, [0, 1], [80, 15]);
  const y3 = interpolate(s3, [0, 1], [80, 31]);
  const g = interpolate(f, [26, 52], [-50, 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: size,
        height: (size * 76) / 88,
        transform: `scale(${0.45 + 0.55 * base}) rotate(${(1 - base) * -14}deg)`,
        opacity: Math.min(1, base * 1.6),
        ...style
      }}
    >
      <svg viewBox="0 0 88 76" width={size} height={(size * 76) / 88} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <clipPath id={id}>
            <path d={SHAPE} />
          </clipPath>
          <linearGradient id={id + 'g'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={SHAPE} fill={C.logo1} />
        <g clipPath={`url(#${id})`}>
          <path d={SHAPE} fill={C.logo2} transform={`translate(44 ${y2}) scale(0.92 1) translate(-44 0)`} />
          <path d={SHAPE} fill={C.logo3} transform={`translate(44 ${y3}) scale(1.08 1) translate(-44 0)`} />
          {glint && !still && g > -50 && g < 140 ? <rect x={g} y={-20} width={22} height={120} fill={`url(#${id}g)`} transform="skewX(-22)" /> : null}
        </g>
      </svg>
    </div>
  );
};
