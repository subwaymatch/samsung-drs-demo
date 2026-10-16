import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FadeUp, Words } from '../components/Overlays';
import { C, MONO, SANS } from '../theme';

// Device photos from public/products with a generic label for each. The model
// names in the demo are made up, so the video shows only the kind of device.
const DEVICES: [string, string][] = [
  ['ps-c1900w', 'Color laser printer'], ['ps-c1950fw', 'Color laser MFP'], ['ps-c2710dw', 'Color laser printer'],
  ['ps-c2760fw', 'Color laser MFP'], ['ps-c2770fx', 'Color laser MFP'], ['ps-c3100nd', 'Color laser printer'],
  ['ps-c3150fr', 'Color laser MFP'], ['ps-c4100nd', 'Color laser printer'], ['ps-c4150fx', 'Color laser MFP'],
  ['ps-c520w', 'Color laser printer'], ['ps-c570fw', 'Color laser MFP'], ['ps-k2290nd', 'Mono A3 copier'],
  ['ps-k4340rx', 'Mono A3 copier'], ['ps-k4390lx', 'Mono A3 copier'], ['ps-k4440lx', 'Mono A3 copier'],
  ['ps-k7490lx', 'Mono A3 copier'], ['ps-k7590lx', 'Mono A3 copier'], ['ps-k7690lx', 'Mono A3 copier'],
  ['ps-m2110w', 'Mono laser printer'], ['ps-m2160fw', 'Mono laser MFP'], ['ps-m2920dw', 'Mono laser printer'],
  ['ps-m2925dw', 'Mono laser printer'], ['ps-m2970fw', 'Mono laser MFP'], ['ps-m2975fw', 'Mono laser MFP'],
  ['ps-m3105dw', 'Mono laser printer'], ['ps-m3155fw', 'Mono laser MFP'], ['ps-m3410nd', 'Mono laser printer'],
  ['ps-m3910nd', 'Mono laser printer'], ['ps-m3960fw', 'Mono laser MFP'], ['ps-m4110nd', 'Mono laser printer'],
  ['ps-m4115nd', 'Mono laser printer'], ['ps-m4160fr', 'Mono laser MFP'], ['ps-m4165fr', 'Mono laser MFP'],
  ['ps-m4170fx', 'Mono laser MFP'], ['ps-m4620nd', 'Mono laser printer'], ['ps-m4670fx', 'Mono laser MFP'],
  ['ps-x3310nr', 'Color A3 copier'], ['ps-x3370nr', 'Color A3 copier'], ['ps-x4310rx', 'Color A3 copier'],
  ['ps-x4340lx', 'Color A3 copier'], ['ps-x4390lx', 'Color A3 copier'], ['ps-x7490lx', 'Color A3 copier'],
  ['ps-x7590lx', 'Color A3 copier'], ['ps-x7690lx', 'Color A3 copier']
];

// Interleave so each row mixes small printers with big copiers.
const ROW_A = DEVICES.filter((_, i) => i % 2 === 0);
const ROW_B = DEVICES.filter((_, i) => i % 2 === 1).reverse();

const ITEM = 300;

const Row: React.FC<{ models: [string, string][]; y: number; dir: 1 | -1; speed: number; delay: number }> = ({ models, y, dir, speed, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const offset = dir === -1 ? -frame * speed : -((models.length * ITEM) - 1920 - 300) + frame * speed;
  return (
    <div style={{ position: 'absolute', left: 0, top: y, height: 260, width: models.length * ITEM, transform: `translateX(${offset - 60}px)` }}>
      {models.map(([m, kind], i) => {
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
            <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em', color: C.faint }}>{kind.toUpperCase()}</div>
          </div>
        );
      })}
    </div>
  );
};

const GRADIENT: React.CSSProperties = {
  background: `linear-gradient(160deg, ${C.logo2}, ${C.logo3} 55%, oklch(0.38 0.17 293))`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  // Room for descenders, which background-clip would otherwise cut off.
  paddingBottom: '0.14em',
  marginBottom: '-0.14em'
};

export const Devices: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
    <Row models={ROW_A} y={64} dir={-1} speed={1.7} delay={2} />
    <Row models={ROW_B} y={780} dir={1} speed={1.7} delay={8} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 356, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, textAlign: 'center' }}>
      <div style={{ fontSize: 104, fontWeight: 770, letterSpacing: '-0.045em', lineHeight: 1.02 }}>
        <Words text="From desktop printers" start={6} stagger={4} />
        <br />
        <Words text="to A3 copiers" start={16} stagger={4} wordStyle={GRADIENT} />
      </div>
      <FadeUp start={34}>
        <div style={{ fontSize: 30, color: C.muted, fontWeight: 450, letterSpacing: '-0.01em' }}>Every firmware defect and code review, from first report to release</div>
      </FadeUp>
    </div>
  </AbsoluteFill>
);
