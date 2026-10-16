import React from 'react';
import { interpolate } from 'remotion';
import { C, EASE } from '../theme';

export type PointerKey = { at: number; x: number; y: number };

/** Pointer position at `frame`, eased between waypoints (page coordinates). */
export function pointerAt(frame: number, keys: PointerKey[]) {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame < b.at) {
      const t = EASE((frame - a.at) / (b.at - a.at));
      return { at: frame, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return keys[keys.length - 1];
}

/** A macOS-style pointer with a click ripple. `clicks` are frames, relative to the same clock as `frame`. */
export const Pointer: React.FC<{ x: number; y: number; frame: number; clicks?: number[]; opacity?: number; scale?: number }> = ({
  x,
  y,
  frame,
  clicks = [],
  opacity = 1,
  scale = 1.35
}) => {
  const last = clicks.filter(c => c <= frame).pop();
  const since = last === undefined ? 99 : frame - last;
  const press = since < 8 ? interpolate(since, [0, 3, 8], [1, 0.82, 1]) : 1;
  const ring = since < 16 ? since / 16 : 1;
  return (
    <>
      {since < 16 ? (
        <div
          style={{
            position: 'absolute',
            left: x - 30,
            top: y - 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            border: `3px solid ${C.accent}`,
            opacity: (1 - ring) * 0.9 * opacity,
            transform: `scale(${0.3 + EASE(ring) * 0.9})`
          }}
        />
      ) : null}
      <svg
        width={26}
        height={32}
        viewBox="0 0 26 32"
        style={{
          position: 'absolute',
          left: x - 3,
          top: y - 2,
          opacity,
          transformOrigin: '3px 2px',
          transform: `scale(${scale * press})`,
          filter: 'drop-shadow(0 3px 5px rgba(20, 10, 40, 0.35))'
        }}
      >
        <path d="M3 2 L3 25 L9 19.5 L13 29 L17 27.3 L13 18 L21 18 Z" fill="#111" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </>
  );
};
