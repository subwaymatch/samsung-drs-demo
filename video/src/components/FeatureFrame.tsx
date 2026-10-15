import { useTransitionProgress } from '@remotion/transitions';
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, EASE, EASE_OUT, MONO, SANS } from '../theme';
import { BrowserWindow } from './Screen';
import { Words } from './Overlays';

export const WIN = { x: 230, y: 206, w: 1460 };

export type Chip = { label: string; icon?: React.ReactNode; on?: [number, number] };

const clampX = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const ChipView: React.FC<{ chip: Chip; i: number }> = ({ chip, i }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 14 - i * 4, fps, config: { damping: 15, stiffness: 180 } });
  const on = chip.on
    ? Math.min(
        interpolate(frame, [chip.on[0], chip.on[0] + 8], [0, 1], { ...clampX, easing: EASE }),
        interpolate(frame, [chip.on[1], chip.on[1] + 8], [1, 0], { ...clampX, easing: EASE })
      )
    : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        height: 44,
        padding: '0 18px',
        borderRadius: 22,
        fontSize: 19,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background: `color-mix(in oklch, ${C.accent} ${on * 100}%, white)`,
        color: `color-mix(in oklch, white ${on * 100}%, ${C.ink3})`,
        boxShadow: `0 0 0 1px color-mix(in oklch, ${C.accent} ${on * 100}%, ${C.accentRule}), 0 ${4 + on * 8}px ${12 + on * 14}px -6px oklch(0.4 0.15 293 / ${0.15 + on * 0.35})`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px) scale(${1 + on * 0.04})`
      }}
    >
      {chip.icon}
      {chip.label}
    </div>
  );
};

/**
 * Layout shared by the product scenes: numbered eyebrow and headline on the
 * left, feature chips on the right that light up as the demo reaches them, and
 * the app window rising in underneath.
 */
export const FeatureFrame: React.FC<{
  index: string;
  label: string;
  title: string;
  chips: Chip[];
  windowTitle: string;
  children: React.ReactNode;
  /** Extra stage-space layers above the window, such as keycaps. */
  stage?: React.ReactNode;
  /**
   * Entered from another product scene with the navigate() transition: the
   * window stays where it is and only its page fades in.
   */
  navigated?: boolean;
}> = ({ index, label, title, chips, windowTitle, children, stage, navigated = false }) => {
  const frame = useCurrentFrame();
  const { entering, exiting } = useTransitionProgress();
  // On the way out, everything but the window clears quickly for the next headline.
  const out = 1 - EASE(Math.min(1, exiting * 2.2));
  const enter = navigated ? 1 : interpolate(frame, [4, 34], [0, 1], { ...clampX, easing: EASE_OUT });
  const pageIn = navigated ? EASE(entering) : 1;
  const eyebrow = interpolate(frame, [0, 14], [0, 1], { ...clampX, easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <div style={{ position: 'absolute', left: WIN.x, top: 66, display: 'flex', flexDirection: 'column', gap: 14, opacity: out }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontSize: 18, fontWeight: 500, letterSpacing: '0.16em', color: C.accent, opacity: eyebrow }}>
          <span>{index}</span>
          <span style={{ width: 36 * eyebrow, height: 2, background: C.accent, borderRadius: 1 }} />
          <span>{label.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 54, fontWeight: 720, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
          <Words text={title} start={3} />
        </div>
      </div>
      <div style={{ position: 'absolute', right: 1920 - WIN.x - WIN.w, top: 110, display: 'flex', gap: 12, opacity: out }}>
        {chips.map((c, i) => (
          <ChipView key={c.label} chip={c} i={i} />
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, perspective: 2400, perspectiveOrigin: '50% 0%' }}>
        <div
          style={{
            position: 'absolute',
            left: WIN.x,
            top: WIN.y,
            transformOrigin: '50% 0%',
            transform: `translateY(${(1 - enter) * 320}px) rotateX(${(1 - enter) * 16}deg)`,
            opacity: Math.min(1, enter * 2) * pageIn
          }}
        >
          <BrowserWindow width={WIN.w} title={windowTitle}>
            {children}
          </BrowserWindow>
        </div>
      </div>
      <AbsoluteFill style={{ opacity: out }}>{stage}</AbsoluteFill>
    </AbsoluteFill>
  );
};
