import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, EASE, EASE_OUT, MONO, SANS } from '../theme';
import { type Rect, SCREEN_H } from './camera';

const clampX = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0→1 over [from, from+dur], then back to 0 over [to, to+dur]. */
export function window01(frame: number, from: number, to: number, dur = 10) {
  return Math.min(interpolate(frame, [from, from + dur], [0, 1], { ...clampX, easing: EASE }), interpolate(frame, [to, to + dur], [1, 0], { ...clampX, easing: EASE }));
}

/**
 * Highlights a screen rect: dims everything else, draws an accent ring and pins a
 * label to it. `p` (0..1) drives the whole thing in and out.
 */
export const Spotlight: React.FC<{
  r: Rect;
  p: number;
  label?: React.ReactNode;
  tone?: 'accent' | 'good' | 'danger';
  below?: boolean;
  dim?: number;
  radius?: number;
}> = ({ r, p, label, tone = 'accent', below = false, dim = 0.32, radius = 12 }) => {
  if (p <= 0.001) return null;
  const color = tone === 'good' ? C.good : tone === 'danger' ? C.danger : C.accent;
  const lp = EASE_OUT(Math.min(1, Math.max(0, p * 1.25 - 0.2)));
  const LH = 46, GAP = 20;
  const fitsAbove = r.y - GAP - LH >= 10;
  const fitsBelow = r.y + r.h + GAP + LH <= SCREEN_H - 10;
  const place = below ? (fitsBelow ? 'below' : fitsAbove ? 'above' : 'inside') : fitsAbove ? 'above' : fitsBelow ? 'below' : 'inside';
  const labelTop = place === 'above' ? r.y - GAP - LH : place === 'below' ? r.y + r.h + GAP : Math.max(10, r.y) + 18;
  const labelLeft = place === 'inside' ? Math.max(10, r.x) + 18 : Math.max(10, r.x - 6);
  const fromBelow = place !== 'below';
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          borderRadius: radius,
          boxShadow: `0 0 0 4000px oklch(0.2 0.05 293 / ${dim * p})`
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: r.x - 6,
          top: r.y - 6,
          width: r.w + 12,
          height: r.h + 12,
          borderRadius: radius + 6,
          border: `3px solid ${color}`,
          opacity: p,
          transform: `scale(${1.04 - 0.04 * p})`,
          boxShadow: `0 0 0 8px color-mix(in oklch, ${color} 18%, transparent), 0 10px 40px color-mix(in oklch, ${color} 30%, transparent)`
        }}
      />
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: labelLeft,
            top: labelTop,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 46,
            padding: '0 20px',
            borderRadius: 23,
            background: color,
            color: '#fff',
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 650,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            opacity: lp,
            transform: `translateY(${(1 - lp) * (fromBelow ? 14 : -14)}px) scale(${0.9 + 0.1 * lp})`,
            transformOrigin: fromBelow ? 'left bottom' : 'left top',
            boxShadow: '0 12px 30px -8px oklch(0.3 0.14 293 / 0.5)'
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
};

/** A row of keyboard keys that press down at the given frames. */
export const Keys: React.FC<{ keys: string[]; pressAt: number; caption?: string; enterAt: number; exitAt?: number }> = ({ keys, pressAt, caption, enterAt, exitAt = 1e9 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - enterAt, fps, config: { damping: 14, stiffness: 200 } });
  const exit = interpolate(frame, [exitAt, exitAt + 6], [1, 0], clampX);
  const since = frame - pressAt;
  const down = since >= 0 && since < 7 ? interpolate(since, [0, 2, 7], [0, 1, 0]) : 0;
  if (frame < enterAt || exit <= 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: Math.min(enter, exit), transform: `translateY(${(1 - enter) * 30}px) scale(${0.85 + 0.15 * enter})` }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {keys.map(k => (
          <div
            key={k}
            style={{
              minWidth: 84,
              height: 84,
              padding: '0 22px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              background: 'linear-gradient(#ffffff, #f3f1f9)',
              border: '1px solid oklch(0.85 0.03 293)',
              boxShadow: `0 ${7 - down * 5}px 0 oklch(0.82 0.04 293), 0 ${18 - down * 10}px 30px -6px oklch(0.25 0.1 293 / 0.35)`,
              transform: `translateY(${down * 5}px)`,
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: k.length > 1 ? 30 : 40,
              color: down > 0.3 ? C.accent : C.ink
            }}
          >
            {k}
          </div>
        ))}
      </div>
      {caption ? (
        <div
          style={{
            fontFamily: SANS,
            fontSize: 22,
            fontWeight: 600,
            color: '#fff',
            background: 'oklch(0.22 0.04 290 / 0.88)',
            padding: '8px 16px',
            borderRadius: 999
          }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
};

/** Text that rises in word by word, un-blurring as it lands. */
export const Words: React.FC<{ text: string; start: number; stagger?: number; dur?: number; style?: React.CSSProperties }> = ({ text, start, stagger = 3, dur = 18, style }) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <span style={style}>
      {words.map((w, i) => {
        const p = interpolate(frame, [start + i * stagger, start + i * stagger + dur], [0, 1], { ...clampX, easing: EASE_OUT });
        return (
          <React.Fragment key={i}>
            <span style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 0.5}em)`, filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined }}>{w}</span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};

/** Fades and lifts children in at `start`. */
export const FadeUp: React.FC<{ start: number; dur?: number; dist?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ start, dur = 18, dist = 24, children, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [0, 1], { ...clampX, easing: EASE_OUT });
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * dist}px)`, ...style }}>{children}</div>;
};

/** Counts up to `to` between `start` and `start + dur`. */
export const Counter: React.FC<{ to: number; start: number; dur?: number; decimals?: number }> = ({ to, start, dur = 30, decimals = 0 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [start, start + dur], [0, to], { ...clampX, easing: EASE_OUT });
  return <>{v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
};
