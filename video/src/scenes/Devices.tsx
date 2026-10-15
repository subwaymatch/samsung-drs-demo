import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Counter, FadeUp, Words } from '../components/Overlays';
import { C, EASE_OUT, MONO, SANS } from '../theme';

const MODELS = (
  'sl-c1810w sl-c1860fw sl-c2620dw sl-c2670fw sl-c2680fx sl-c3010nd sl-c3060fr sl-c4010nd sl-c4060fx sl-c430w sl-c480fw sl-k2200nd sl-k4250rx sl-k4300lx sl-k4350lx ' +
  'sl-k7400lx sl-k7500lx sl-k7600lx sl-m2020w sl-m2070fw sl-m2830dw sl-m2835dw sl-m2880fw sl-m2885fw sl-m3015dw sl-m3065fw sl-m3320nd sl-m3820nd sl-m3870fw sl-m4020nd ' +
  'sl-m4025nd sl-m4070fr sl-m4075fr sl-m4080fx sl-m4530nd sl-m4580fx sl-x3220nr sl-x3280nr sl-x4220rx sl-x4250lx sl-x4300lx sl-x7400lx sl-x7500lx sl-x7600lx'
).split(' ');

// Interleave so each row mixes small printers with big copiers.
const ROW_A = MODELS.filter((_, i) => i % 2 === 0);
const ROW_B = MODELS.filter((_, i) => i % 2 === 1).reverse();

const ITEM = 300;

const Row: React.FC<{ models: string[]; y: number; dir: 1 | -1; speed: number; delay: number }> = ({ models, y, dir, speed, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const offset = dir === -1 ? -frame * speed : -((models.length * ITEM) - 1920 - 300) + frame * speed;
  return (
    <div style={{ position: 'absolute', left: 0, top: y, height: 260, width: models.length * ITEM, transform: `translateX(${offset - 60}px)` }}>
      {models.map((m, i) => {
        // Pop in roughly left to right as the row arrives.
        const visibleX = i * ITEM + offset;
        const order = Math.max(0, visibleX) / 1920;
        const s = spring({ frame: frame - delay - order * 18, fps, config: { damping: 13, stiffness: 120 } });
        return (
          <div key={m} style={{ position: 'absolute', left: i * ITEM, top: 0, width: ITEM, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${0.85 + 0.15 * s})` }}>
            <div style={{ position: 'relative', width: 240, height: 160 }}>
              <div style={{ position: 'absolute', left: 30, right: 30, bottom: 4, height: 18, borderRadius: '50%', background: 'radial-gradient(closest-side, oklch(0.3 0.06 293 / 0.22), transparent)' }} />
              <Img src={staticFile(`products/${m}.webp`)} style={{ position: 'absolute', inset: 0, width: 240, height: 160, objectFit: 'contain' }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.04em', color: C.faint }}>{m.toUpperCase()}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Devices: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [20, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT });
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <Row models={ROW_A} y={64} dir={-1} speed={1.7} delay={2} />
      <Row models={ROW_B} y={780} dir={1} speed={1.7} delay={8} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div
            style={{
              fontSize: 230,
              fontWeight: 800,
              letterSpacing: '-0.06em',
              lineHeight: 0.85,
              fontVariantNumeric: 'tabular-nums',
              background: `linear-gradient(160deg, ${C.logo2}, ${C.logo3} 55%, oklch(0.38 0.17 293))`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: `drop-shadow(0 18px 40px oklch(0.5 0.19 293 / ${0.3 * glow}))`,
              width: 300,
              textAlign: 'right'
            }}
          >
            <Counter to={44} start={6} dur={40} />
          </div>
          <div style={{ fontSize: 72, fontWeight: 720, letterSpacing: '-0.035em', lineHeight: 1.02 }}>
            <Words text="printer and copier" start={10} />
            <br />
            <Words text="models" start={18} />
          </div>
        </div>
        <FadeUp start={34}>
          <div style={{ fontSize: 30, color: C.muted, fontWeight: 450, letterSpacing: '-0.01em' }}>
            Every firmware defect and code review, from first report to release
          </div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  );
};
