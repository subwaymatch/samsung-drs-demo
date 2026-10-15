import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { NightBg } from '../components/Backgrounds';
import { DrsMark } from '../components/Logo';
import { FadeUp, Words } from '../components/Overlays';
import { EASE, MONO, SANS } from '../theme';

const clampX = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  // The mark plays alone, then rises to make room for the title.
  const lift = interpolate(frame, [24, 46], [0, 1], { ...clampX, easing: EASE });
  const markSize = 250 - lift * 70;
  const markTop = 540 - (markSize * 76) / 88 / 2 - lift * 210;
  const ring = interpolate(frame, [4, 60], [0, 1], { ...clampX, easing: EASE });

  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <NightBg />
      {/* Expanding halo behind the mark */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 330,
          top: markTop + (markSize * 76) / 88 / 2 - 330,
          width: 660,
          height: 660,
          borderRadius: '50%',
          border: '1.5px solid oklch(0.75 0.12 293 / 0.5)',
          opacity: (1 - ring) * 0.9,
          transform: `scale(${0.3 + ring * 1.1})`
        }}
      />
      <div style={{ position: 'absolute', left: 960 - markSize / 2, top: markTop, filter: 'drop-shadow(0 20px 50px oklch(0.5 0.2 293 / 0.55))' }}>
        <DrsMark size={markSize} delay={2} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 96, fontWeight: 760, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1 }}>
          <Words text="Defects and Reviews System" start={34} stagger={4} dur={20} />
        </div>
        <FadeUp start={52}>
          <div style={{ fontSize: 32, fontWeight: 450, color: 'oklch(0.86 0.04 293)', letterSpacing: '-0.01em' }}>
            Defect tracking and code review for printer and copier firmware
          </div>
        </FadeUp>
        <FadeUp start={64} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: '0.2em', color: 'oklch(0.78 0.1 293)' }}>
            SAMSUNG ELECTRONICS, PRINTING SOLUTIONS, 2016-2017
          </div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};
