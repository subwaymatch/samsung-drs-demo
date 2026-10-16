import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { EASE, HEIGHT, WIDTH } from '../theme';

type NoProps = Record<string, never>;
const RADIUS = Math.hypot(WIDTH, HEIGHT) / 2 + 40;

/** The outgoing scene opens a widening hole in its middle, showing the scene beneath. */
const HoleReveal: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress }) => {
  if (presentationDirection === 'entering') {
    const p = EASE(presentationProgress);
    return <AbsoluteFill style={{ transform: `scale(${1.08 - 0.08 * p})` }}>{children}</AbsoluteFill>;
  }
  const r = EASE(presentationProgress) * RADIUS;
  const mask = `radial-gradient(circle at 50% 50%, transparent ${r}px, black ${r + 2}px)`;
  return <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>{children}</AbsoluteFill>;
};
export const holeReveal = (): TransitionPresentation<NoProps> => ({ component: HoleReveal, props: {} });

/** The incoming scene grows out of a circle in the middle of the frame. */
const IrisIn: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress }) => {
  if (presentationDirection === 'exiting') {
    const p = EASE(presentationProgress);
    return <AbsoluteFill style={{ transform: `scale(${1 - 0.06 * p})`, filter: `blur(${p * 6}px)` }}>{children}</AbsoluteFill>;
  }
  const r = EASE(presentationProgress) * RADIUS;
  return <AbsoluteFill style={{ clipPath: `circle(${r}px at 50% 50%)` }}>{children}</AbsoluteFill>;
};
export const irisIn = (): TransitionPresentation<NoProps> => ({ component: IrisIn, props: {} });

type PushProps = { distance: number; blur: number };
/** Both scenes slide sideways while cross-fading with a little motion blur. */
const SoftPush: React.FC<TransitionPresentationComponentProps<PushProps>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const p = EASE(presentationProgress);
  const { distance, blur } = passedProps;
  const entering = presentationDirection === 'entering';
  const x = entering ? (1 - p) * distance : -p * distance;
  const o = entering ? Math.min(1, p * 1.6) : Math.min(1, (1 - p) * 1.6);
  const b = (entering ? 1 - p : p) * blur;
  return <AbsoluteFill style={{ transform: `translateX(${x}px)`, opacity: o, filter: b > 0.05 ? `blur(${b}px)` : undefined }}>{children}</AbsoluteFill>;
};
export const softPush = (distance = 320, blur = 6): TransitionPresentation<PushProps> => ({ component: SoftPush, props: { distance, blur } });

/** Cross-fade where the outgoing scene drifts up and the incoming one settles from below. */
const Rise: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = EASE(presentationProgress);
  const entering = presentationDirection === 'entering';
  const y = entering ? (1 - p) * 120 : -p * 120;
  // The outgoing scene is gone by the halfway point so two headlines never stack up.
  const o = entering ? Math.min(1, p * 1.5) : Math.max(0, 1 - p * 2);
  return <AbsoluteFill style={{ transform: `translateY(${y}px)`, opacity: o }}>{children}</AbsoluteFill>;
};
export const rise = (): TransitionPresentation<NoProps> => ({ component: Rise, props: {} });

/**
 * Passes both scenes through untouched; the scenes animate themselves with
 * useTransitionProgress(). FeatureFrame uses it to keep the browser window in
 * place and cross-fade the page inside it, like navigating within the app.
 */
const Navigate: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children }) => <AbsoluteFill>{children}</AbsoluteFill>;
export const navigate = (): TransitionPresentation<NoProps> => ({ component: Navigate, props: {} });
