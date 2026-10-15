import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FadeUp, Words } from '../components/Overlays';
import { BEAT, C, MONO, SANS } from '../theme';

const ORIGINAL = ['React', 'Node.js', 'Bootstrap', 'Custom CSS'];
const SYNCED = ['IBM Rational ClearQuest', 'ClearCase', 'Review Board', 'Perforce', 'Helix Swarm', 'Jira', 'Confluence'];
const NOW = ['Vinext: Next.js API on Vite', 'React 19', 'Base UI', 'Tailwind CSS v4', 'Lucide', 'React Flow', 'Cloudflare Workers'];

const Tag: React.FC<{ label: string; at: number; strong?: boolean }> = ({ label, at, strong }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 190 } });
  return (
    <div
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderRadius: 12,
        fontSize: 22,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        background: strong ? C.accent : '#fff',
        color: strong ? '#fff' : C.ink2,
        boxShadow: strong ? '0 12px 26px -10px oklch(0.4 0.18 293 / 0.6)' : `0 0 0 1px ${C.accentRule}, 0 8px 18px -10px oklch(0.3 0.1 293 / 0.25)`,
        opacity: s,
        transform: `translateY(${(1 - s) * 22}px) scale(${0.8 + 0.2 * s})`
      }}
    >
      {label}
    </div>
  );
};

const Panel: React.FC<{ kicker: string; title: string; children: React.ReactNode; start: number; accent?: boolean }> = ({ kicker, title, children, start, accent }) => (
  <FadeUp start={start} dist={40} style={{ flex: 1 }}>
    <div
      style={{
        height: 470,
        boxSizing: 'border-box',
        padding: '40px 44px',
        borderRadius: 26,
        background: accent ? 'linear-gradient(170deg, #fff, oklch(0.97 0.025 293))' : 'oklch(1 0 0 / 0.7)',
        boxShadow: accent ? `0 0 0 2px ${C.accentGlow}, 0 30px 70px -26px oklch(0.4 0.18 293 / 0.45)` : '0 0 0 1px oklch(0.45 0.05 293 / 0.12), 0 24px 50px -30px oklch(0.3 0.1 293 / 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }}
    >
      <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: '0.16em', color: accent ? C.accent : C.muted }}>{kicker}</div>
      <div style={{ fontSize: 40, fontWeight: 720, letterSpacing: '-0.03em' }}>{title}</div>
      {children}
    </div>
  </FadeUp>
);

export const Stack: React.FC = () => {
  const t0 = 18;
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink }}>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 196, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FadeUp start={0} dur={14}>
          <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, letterSpacing: '0.16em', color: C.accent }}>08 — THE BUILD</div>
        </FadeUp>
        <div style={{ fontSize: 66, fontWeight: 740, letterSpacing: '-0.04em', lineHeight: 1 }}>
          <Words text="Built in 2016. Rebuilt with today's tools." start={4} stagger={3} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 170, right: 170, top: 394, display: 'flex', gap: 40 }}>
        <Panel kicker="2016–2017 · ORIGINAL" title="React and Node.js" start={t0}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {ORIGINAL.map((l, i) => (
              <Tag key={l} label={l} at={t0 + 8 + i * 3} />
            ))}
          </div>
          <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>Synced with</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {SYNCED.map((l, i) => (
              <Tag key={l} label={l} at={t0 + 22 + i * 2} />
            ))}
          </div>
        </Panel>
        <Panel kicker="THIS DEMO" title="Same product, modern stack" start={t0 + BEAT} accent>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {NOW.map((l, i) => (
              <Tag key={l} label={l} at={t0 + BEAT + 10 + i * 4} strong={i === 0 || i === 6} />
            ))}
          </div>
          <div style={{ fontSize: 21, lineHeight: 1.55, color: C.ink3, marginTop: 10 }}>
            Mock data generated from a fixed seed: 812 defects and 631 code reviews from January 2016 to September 2017, following working days and Korean public holidays.
          </div>
        </Panel>
      </div>
    </AbsoluteFill>
  );
};
