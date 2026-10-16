import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { DrsMark } from '../components/Logo';
import { Eyebrow, FadeUp, Words } from '../components/Overlays';
import { cap } from '../layout';
import { C, EASE_OUT, MONO, SANS } from '../theme';

// The email column of the digests page, in CSS pixels of the capture.
const CROP = { x: 300, y: 186, w: 888, h: 1600 };
const PAPER_W = 760;
const K = PAPER_W / CROP.w;
const SLOT_Y = 994;
const PRINTER = { x: 1040, w: 900 };
const FEED = Easing.bezier(0.3, 0.15, 0.35, 1);

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 18px', borderRadius: 22, background: '#fff', boxShadow: `0 0 0 1px ${C.accentRule}`, fontSize: 19, fontWeight: 600, color: C.ink3 }}>
    {children}
  </div>
);

export const Digests: React.FC = () => {
  const f = useCurrentFrame();
  // The sheet feeds up out of the printer in one continuous motion: a gentle
  // start, a steady middle and a soft stop. (Moving it in line-by-line steps
  // left frames where it stood still, which read as lag at 30 fps.)
  const rise = interpolate(f, [12, 104], [0, SLOT_Y - 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FEED });
  const led = Math.sin(f / 3) > 0 || f > 104;
  const printer = interpolate(f, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <div style={{ position: 'absolute', left: 170, top: 300, width: 760, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <FadeUp start={0} dur={14}>
          <Eyebrow index="06" label="Email digests" />
        </FadeUp>
        <div style={{ fontSize: 76, fontWeight: 740, letterSpacing: '-0.04em', lineHeight: 1.04 }}>
          <Words text="Yesterday in DRS," start={4} />
          <br />
          <Words text="in every inbox by 8:30" start={12} />
        </div>
        <FadeUp start={26}>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: C.muted, maxWidth: 640 }}>Daily and weekly summaries of new defects, fixes, review requests and decisions, archived back to January 2016.</div>
        </FadeUp>
        <FadeUp start={36}>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <Pill>Daily, every weekday</Pill>
            <Pill>Weekly, on Mondays</Pill>
          </div>
        </FadeUp>
      </div>

      {/* Sheet, clipped at the printer's output slot */}
      <div style={{ position: 'absolute', left: PRINTER.x + (PRINTER.w - PAPER_W) / 2, top: 0, width: PAPER_W, height: SLOT_Y + 2, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: SLOT_Y - rise,
            width: PAPER_W,
            height: CROP.h * K,
            overflow: 'hidden',
            background: '#fff',
            borderRadius: '6px 6px 0 0',
            boxShadow: '0 0 0 1px oklch(0.45 0.05 293 / 0.1), 0 30px 60px -20px oklch(0.3 0.12 293 / 0.35)'
          }}
        >
          <Img src={staticFile(cap('digests-full'))} style={{ position: 'absolute', width: 1600 * K, left: -CROP.x * K, top: -CROP.y * K + 24 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, background: 'linear-gradient(transparent, oklch(0.3 0.05 293 / 0.08))' }} />
        </div>
      </div>

      {/* Printer */}
      <div style={{ position: 'absolute', left: PRINTER.x, top: SLOT_Y - 6, width: PRINTER.w, height: 140, transform: `translateY(${(1 - printer) * 160}px)` }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '24px 24px 0 0',
            background: `linear-gradient(180deg, oklch(0.32 0.04 290), ${C.ink} 40%, oklch(0.17 0.02 290))`,
            boxShadow: '0 -1px 0 oklch(0.5 0.05 290) inset, 0 -20px 50px -20px oklch(0.2 0.08 293 / 0.5)'
          }}
        />
        <div style={{ position: 'absolute', left: (PRINTER.w - PAPER_W) / 2 - 16, width: PAPER_W + 32, top: 4, height: 6, borderRadius: 3, background: 'oklch(0.08 0.01 290)' }} />
        <div style={{ position: 'absolute', left: 34, top: 34, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DrsMark size={30} still />
          <span style={{ display: 'flex', gap: 14, fontFamily: MONO, fontSize: 15, letterSpacing: '0.18em', color: 'oklch(0.75 0.03 290)' }}>
            <span>DAILY SUMMARY</span>
            <span style={{ color: C.logo1 }}>08:30</span>
          </span>
        </div>
        <div style={{ position: 'absolute', right: 36, top: 40, width: 12, height: 12, borderRadius: 6, background: led ? C.goodBar : 'oklch(0.35 0.04 155)', boxShadow: led ? '0 0 14px oklch(0.7 0.16 155)' : 'none' }} />
      </div>
    </AbsoluteFill>
  );
};
