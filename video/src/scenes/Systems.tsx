import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { DrsMark } from '../components/Logo';
import { Counter, FadeUp, Words } from '../components/Overlays';
import { C, EASE, EASE_OUT, MONO, SANS } from '../theme';

type Sys = { name: string; logo: string; logoH: number; stat: string; sync: string; edge: string };

const LEGACY: Sys[] = [
  { name: 'Rational ClearQuest', logo: 'logos/ibm.svg', logoH: 18, stat: '589 defects lead here', sync: 'Synced 5 min ago', edge: 'Defects' },
  { name: 'Rational ClearCase', logo: 'logos/ibm.svg', logoH: 18, stat: 'Frozen for waves 1 and 2', sync: 'Synced 1 hr ago', edge: 'UCM history' },
  { name: 'Review Board', logo: 'logos/reviewboard.png', logoH: 24, stat: 'Wave 3 teams still review here', sync: 'Synced 4 min ago', edge: 'Reviews' }
];
const NEW: Sys[] = [
  { name: 'Jira', logo: 'logos/jira.svg', logoH: 22, stat: '223 lead, 289 mirrored', sync: 'Synced 3 min ago', edge: 'Issues' },
  { name: 'Perforce P4', logo: 'logos/perforce.svg', logoH: 22, stat: '533 changelists linked', sync: 'Synced 1 min ago', edge: 'Jobs, CLs' },
  { name: 'Helix Swarm', logo: 'logos/perforce.svg', logoH: 22, stat: '631 code reviews', sync: 'Synced 2 min ago', edge: 'Reviews' },
  { name: 'Confluence', logo: 'logos/confluence.svg', logoH: 22, stat: 'Root-cause and test pages', sync: 'Synced 12 min ago', edge: 'Pages' }
];

const CARD_W = 390;
const CARD_H = 118;
const CY = 626;
const LEFT_X = 130;
const RIGHT_X = 1920 - 130 - CARD_W;
const HUB = { x: 960 - 230, y: CY - 135, w: 460, h: 270 };
const leftY = (i: number) => CY - (3 * CARD_H + 2 * 30) / 2 + i * (CARD_H + 30);
const rightY = (i: number) => CY - (4 * CARD_H + 3 * 18) / 2 + i * (CARD_H + 18);

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = (x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
};

// Legacy systems feed into DRS; DRS mirrors records out to the new ones.
const EDGES = [
  ...LEGACY.map((s, i) => ({ s, d: curve(LEFT_X + CARD_W, leftY(i) + CARD_H / 2, HUB.x, CY - 40 + i * 40), out: false })),
  ...NEW.map((s, i) => ({ s, d: curve(HUB.x + HUB.w, CY - 54 + i * 36, RIGHT_X, rightY(i) + CARD_H / 2), out: true }))
];

const Card: React.FC<{ sys: Sys; x: number; y: number; start: number; from: number }> = ({ sys, x, y, start, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 140 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        padding: '16px 20px',
        borderRadius: 14,
        background: '#fff',
        boxShadow: '0 0 0 1px oklch(0.45 0.05 293 / 0.13), 0 14px 34px -14px oklch(0.3 0.12 293 / 0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        opacity: s,
        transform: `translateX(${(1 - s) * from}px)`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 21, fontWeight: 680, letterSpacing: '-0.015em' }}>
        <Img src={staticFile(sys.logo)} style={{ height: sys.logoH, width: 'auto' }} />
        {sys.name}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: C.ink2 }}>{sys.stat}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: C.muted }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: C.goodBar }} />
        {sys.sync}
      </div>
    </div>
  );
};

export const Systems: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hub = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 110 } });
  const push = interpolate(frame, [158, 195], [1, 1.07], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
  const flow = frame * 0.9;
  const groupLabel = (start: number): React.CSSProperties => ({
    position: 'absolute',
    fontFamily: MONO,
    fontSize: 16,
    letterSpacing: '0.16em',
    color: C.muted,
    opacity: interpolate(frame, [start, start + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 58, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <FadeUp start={0} dur={14}>
          <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, letterSpacing: '0.16em', color: C.accent }}>MID-MIGRATION, TEAM BY TEAM</div>
        </FadeUp>
        <div style={{ fontSize: 66, fontWeight: 740, letterSpacing: '-0.04em', lineHeight: 1 }}>
          <Words text="Seven systems. One linked record." start={4} stagger={4} />
        </div>
      </div>

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: `960px ${CY}px` }}>
        <div style={{ ...groupLabel(26), left: LEFT_X, top: leftY(0) - 40 }}>LEGACY · IBM RATIONAL, REVIEW BOARD</div>
        <div style={{ ...groupLabel(30), left: RIGHT_X, top: rightY(0) - 40 }}>NEW · PERFORCE, ATLASSIAN</div>

        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            {EDGES.map((e, i) => {
              const p = interpolate(frame, [48 + i * 5, 84 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
              const ev = evolvePath(p, e.d);
              return (
                <mask id={`edge${i}`} key={i} maskUnits="userSpaceOnUse">
                  <path d={e.d} stroke="#fff" strokeWidth={10} fill="none" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
                </mask>
              );
            })}
          </defs>
          {EDGES.map((e, i) => (
            <path key={i} d={e.d} mask={`url(#edge${i})`} stroke={C.accentGlow} strokeWidth={2.5} fill="none" strokeDasharray="7 7" strokeDashoffset={e.out ? -flow : flow} strokeLinecap="round" />
          ))}
          {EDGES.map((e, i) => {
            const len = getLength(e.d);
            const dots = [];
            for (let k = 0; k < 2; k++) {
              const t0 = 92 + i * 6 + k * 26;
              const local = (frame - t0) % 52;
              if (frame < t0) continue;
              const t = local / 34;
              if (t > 1) continue;
              const pt = getPointAtLength(e.d, len * t)!;
              const a = Math.sin(t * Math.PI);
              dots.push(
                <g key={k} opacity={a}>
                  <circle cx={pt.x} cy={pt.y} r={13} fill="oklch(0.6 0.18 293 / 0.18)" />
                  <circle cx={pt.x} cy={pt.y} r={5.5} fill={C.accent} />
                </g>
              );
            }
            return <g key={i}>{dots}</g>;
          })}
        </svg>

        {EDGES.map((e, i) => {
          const pt = getPointAtLength(e.d, getLength(e.d) * 0.5)!;
          const o = interpolate(frame, [76 + i * 5, 90 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT });
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pt.x,
                top: pt.y,
                transform: `translate(-50%, -50%) scale(${0.8 + 0.2 * o})`,
                opacity: o,
                padding: '4px 11px',
                borderRadius: 999,
                background: C.canvas,
                boxShadow: `0 0 0 1px ${C.accentRule}`,
                fontSize: 16,
                fontWeight: 550,
                color: C.ink3,
                whiteSpace: 'nowrap'
              }}
            >
              {e.s.edge}
            </div>
          );
        })}

        {LEGACY.map((s, i) => (
          <Card key={s.name} sys={s} x={LEFT_X} y={leftY(i)} start={24 + i * 5} from={-80} />
        ))}
        {NEW.map((s, i) => (
          <Card key={s.name} sys={s} x={RIGHT_X} y={rightY(i)} start={28 + i * 5} from={80} />
        ))}

        <div
          style={{
            position: 'absolute',
            left: HUB.x,
            top: HUB.y,
            width: HUB.w,
            height: HUB.h,
            boxSizing: 'border-box',
            padding: '26px 30px',
            borderRadius: 20,
            background: 'linear-gradient(180deg, #fff, oklch(0.985 0.012 293))',
            boxShadow: `0 0 0 2px ${C.accentGlow}, 0 0 0 10px oklch(0.6 0.16 293 / 0.1), 0 30px 70px -20px oklch(0.4 0.18 293 / 0.45)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            opacity: hub,
            transform: `scale(${0.7 + 0.3 * hub})`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DrsMark size={58} delay={14} />
            <span style={{ fontSize: 40, fontWeight: 780, letterSpacing: '-0.03em' }}>DRS</span>
          </div>
          <div style={{ fontSize: 19, lineHeight: 1.4, color: C.muted }}>Links each defect and code review across all seven systems</div>
          <div style={{ display: 'flex', gap: 22, fontSize: 23, fontWeight: 680, color: C.accentText, fontVariantNumeric: 'tabular-nums' }}>
            <span>
              <Counter to={812} start={40} dur={44} /> defects
            </span>
            <span>
              <Counter to={631} start={46} dur={44} /> code reviews
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 17, color: C.ink3 }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: C.goodBar }} />
            All systems connected
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
