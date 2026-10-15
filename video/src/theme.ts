import { Easing } from 'remotion';

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;

/** Scenes and transitions are cut on a 120 BPM grid so a music track can be laid on top. */
export const BPM = 120;
export const beats = (n: number) => Math.round((n * 60 * FPS) / BPM);
export const BEAT = beats(1);

// Colors from app/globals.css
export const C = {
  ink: 'oklch(0.22 0.02 290)',
  ink2: 'oklch(0.3 0.02 290)',
  ink3: 'oklch(0.35 0.02 290)',
  muted: 'oklch(0.5 0.02 290)',
  faint: 'oklch(0.62 0.015 290)',
  line: 'oklch(0.93 0.008 290)',
  surface: 'oklch(0.99 0.004 290)',
  canvas: 'oklch(0.982 0.009 293)',
  accent: 'oklch(0.5 0.19 293)',
  accentInk: 'oklch(0.42 0.17 293)',
  accentText: 'oklch(0.45 0.17 293)',
  accentSoft: 'oklch(0.95 0.035 293)',
  accentTint: 'oklch(0.96 0.03 293)',
  accentRule: 'oklch(0.9 0.04 293)',
  accentGlow: 'oklch(0.6 0.16 293)',
  logo1: 'oklch(0.8 0.1 293)',
  logo2: 'oklch(0.66 0.16 293)',
  logo3: 'oklch(0.5 0.19 293)',
  night: 'oklch(0.15 0.03 290)',
  night2: 'oklch(0.19 0.045 292)',
  good: 'oklch(0.46 0.12 155)',
  goodBar: 'oklch(0.62 0.14 155)',
  danger: 'oklch(0.52 0.18 25)',
  amber: 'oklch(0.73 0.16 55)'
};

export const SANS = 'Pretendard, system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** Smooth camera-style ease. */
export const EASE = Easing.bezier(0.65, 0, 0.35, 1);
/** Fast-out, gentle settle for things coming on screen. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
