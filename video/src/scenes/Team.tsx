import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Eyebrow, FadeUp, Words } from '../components/Overlays';
import { C, EASE, MONO, SANS } from '../theme';

// The people on D-17-0363 and CR-2225: reported, fixed and approved.
const STORY: Record<string, { verb: string; name: string; role: string }> = {
  u1: { verb: 'Reported', name: '김지현', role: 'Senior QA Engineer' },
  u2: { verb: 'Fixed', name: '박성민', role: 'Senior Firmware Engineer' },
  u11: { verb: 'Approved', name: '윤재석', role: 'Code Reviewer' }
};

const ROWS = [12, 11, 11];
const TW = 122;
const TH = 152;
const GAP = 16;
const TOP = 352;

// Seat the three story people apart from each other; everyone else fills in order.
const SEATS: Record<number, string> = { 3: 'u1', 17: 'u2', 30: 'u11' };
const ORDER = (() => {
  const rest = Array.from({ length: 34 }, (_, i) => 'u' + (i + 1)).filter(u => !Object.values(SEATS).includes(u));
  return Array.from({ length: 34 }, (_, i) => SEATS[i] || rest.shift()!);
})();

export const Team: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const story = interpolate(f, [92, 108], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });

  let k = 0;
  const tiles: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  ROWS.forEach((n, r) => {
    const rowW = n * TW + (n - 1) * GAP;
    const x0 = (1920 - rowW) / 2;
    for (let c = 0; c < n; c++, k++) {
      const u = ORDER[k];
      const x = x0 + c * (TW + GAP);
      const y = TOP + r * (TH + GAP);
      const d = Math.hypot(x + TW / 2 - 960, (y + TH / 2 - 600) * 1.6);
      const s = spring({ frame: f - 8 - d / 34, fps, config: { damping: 13, stiffness: 130 } });
      const hero = STORY[u];
      const bob = Math.sin((f + k * 7) / 18) * 3;
      tiles.push(
        <div
          key={u}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: TW,
            height: TH,
            borderRadius: 16,
            overflow: 'hidden',
            background: `oklch(0.93 0.03 ${(k * 37) % 360})`,
            opacity: s * (hero ? 1 : 1 - story * 0.6),
            transform: `translateY(${(1 - s) * 50 + bob}px) scale(${(0.6 + 0.4 * s) * (hero ? 1 + story * 0.14 : 1 - story * 0.04)})`,
            boxShadow: hero
              ? `0 0 0 ${story * 4}px ${C.accent}, 0 ${10 + story * 20}px ${30 + story * 20}px -10px oklch(0.35 0.15 293 / ${0.25 + story * 0.3})`
              : '0 10px 26px -12px oklch(0.3 0.1 293 / 0.3)',
            zIndex: hero ? 2 : 1
          }}
        >
          <Img src={staticFile(`photos/${u}.webp`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%' }} />
        </div>
      );
      if (hero) {
        const lp = interpolate(f, [100, 116], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
        labels.push(
          <div
            key={u + 'l'}
            style={{
              position: 'absolute',
              left: x + TW / 2,
              top: y + TH + 18,
              transform: `translate(-50%, ${(1 - lp) * -12}px)`,
              opacity: lp,
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '10px 18px',
              borderRadius: 14,
              background: '#fff',
              boxShadow: '0 0 0 1px oklch(0.45 0.05 293 / 0.12), 0 16px 34px -12px oklch(0.3 0.12 293 / 0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.14em', color: C.accent }}>{hero.verb.toUpperCase()}</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{hero.name}</span>
            <span style={{ fontSize: 16, color: C.muted }}>{hero.role}</span>
          </div>
        );
      }
    }
  });

  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <FadeUp start={0} dur={14}>
          <Eyebrow index="07" label="The people" />
        </FadeUp>
        <div style={{ fontSize: 66, fontWeight: 740, letterSpacing: '-0.04em', lineHeight: 1 }}>
          <Words text="Used by teams in Suwon and Bangalore" start={4} stagger={4} />
        </div>
        <FadeUp start={22}>
          <div style={{ fontSize: 28, color: C.muted }}>Firmware, QA, hardware and code review, all working from the same records</div>
        </FadeUp>
      </div>
      {tiles}
      {labels}
    </AbsoluteFill>
  );
};
