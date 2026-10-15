import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { NightBg } from '../components/Backgrounds';
import { DrsMark } from '../components/Logo';
import { FadeUp, Words } from '../components/Overlays';
import { MONO, SANS } from '../theme';

const FEATURES = ['Insights', 'Keyboard triage', 'Duplicate detection', 'Code review', 'Email digests'];

export const Outro: React.FC<{ credit?: string; url?: string }> = ({ credit, url }) => {
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [150, 178], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <NightBg frameOffset={400} />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, textAlign: 'center' }}>
          <div style={{ filter: 'drop-shadow(0 20px 50px oklch(0.5 0.2 293 / 0.55))' }}>
            <DrsMark size={170} delay={6} />
          </div>
          <div style={{ fontSize: 88, fontWeight: 760, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1, marginTop: 10 }}>
            <Words text="Defects and Reviews System" start={20} stagger={4} dur={22} />
          </div>
          <FadeUp start={36}>
            <div style={{ fontFamily: MONO, fontSize: 19, letterSpacing: '0.2em', color: 'oklch(0.78 0.1 293)' }}>
              SAMSUNG ELECTRONICS, PRINTING SOLUTIONS, 2016-2017
            </div>
          </FadeUp>
          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            {FEATURES.map((t, i) => (
              <FadeUp key={t} start={46 + i * 4} dist={16}>
                <span
                  style={{
                    display: 'block',
                    padding: '10px 22px',
                    borderRadius: 999,
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#fff',
                    background: 'oklch(1 0 0 / 0.07)',
                    boxShadow: '0 0 0 1px oklch(1 0 0 / 0.18)'
                  }}
                >
                  {t}
                </span>
              </FadeUp>
            ))}
          </div>
        </div>
        <FadeUp start={70} style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {credit || url ? (
            <div style={{ display: 'flex', gap: 22, fontSize: 24, fontWeight: 600, color: '#fff' }}>
              {credit ? <span>{credit}</span> : null}
              {url ? <span style={{ fontFamily: MONO, fontWeight: 500, color: 'oklch(0.82 0.1 293)' }}>{url}</span> : null}
            </div>
          ) : null}
          <div style={{ fontSize: 18, color: 'oklch(0.7 0.03 293)' }}>A recreation with mock data. Product names and logos belong to their owners.</div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
