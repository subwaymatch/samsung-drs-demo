import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { camAt, frame as framed } from '../components/camera';
import { FeatureFrame } from '../components/FeatureFrame';
import { Keys } from '../components/Overlays';
import { Screen } from '../components/Screen';
import { cap } from '../layout';
import { BEAT } from '../theme';

// One key per beat: J moves the highlight, X toggles the row, and the bulk-edit
// bar appears with the first selection. Matches the keys in scripts/capture.mjs.
const KEYS = ['J', 'J', 'X', 'J', 'X', 'J', 'X'];
const FIRST = 3 * BEAT + 6;
const PRESS = KEYS.map((_, i) => FIRST + i * BEAT);
const PALETTE = FIRST + 8 * BEAT;
const TYPE = [PALETTE + 14, PALETTE + 24, PALETTE + 34];

export const Triage: React.FC = () => {
  const f = useCurrentFrame();
  const shown = PRESS.filter(t => f >= t).length;
  const pal = f >= PALETTE ? 1 + TYPE.filter(t => f >= t).length : 0;

  const cam = camAt(f, [
    { at: 0, zoom: 1, fx: 800, fy: 450 },
    { at: 20 },
    { at: 40, ...framed({ x: 310, y: 120, w: 1230, h: 700 }, 0, 20) },
    { at: PALETTE - 10 },
    { at: PALETTE + 8, ...framed({ x: 0, y: 70, w: 560, h: 200 }, 0, 30) }
  ]);

  // One sequence: the eight list frames, then the four palette frames.
  const active = pal ? 7 + pal : shown;
  const names = [...Array.from({ length: 8 }, (_, i) => `defects-${i}`), ...Array.from({ length: 4 }, (_, i) => `palette-${i}`)];
  const shots = names.map((n, i) => ({ src: cap(n), on: i === active, mount: Math.abs(i - active) <= 1 }));

  return (
    <FeatureFrame
      navigated
      index="02"
      label="Triage"
      title="Built for the keyboard"
      windowTitle="Defects - DRS"
      chips={[
        { label: 'J / K to move', on: [PRESS[0], PRESS[6] + 8] },
        { label: 'X to select and bulk edit', on: [PRESS[2], PALETTE - 6] },
        { label: 'Ctrl K to search', on: [PALETTE, 400] }
      ]}
      stage={
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'column', paddingBottom: 70 }}>
          {PRESS.map((t, i) => (
            <div key={i} style={{ position: 'absolute', bottom: 70 }}>
              <Keys keys={[KEYS[i]]} pressAt={t} enterAt={t - 3} exitAt={i < PRESS.length - 1 ? PRESS[i + 1] - 3 : t + BEAT} caption={KEYS[i] === 'J' ? 'Next defect' : 'Select'} />
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 70 }}>
            <Keys keys={['Ctrl', 'K']} pressAt={PALETTE} enterAt={PALETTE - 4} exitAt={PALETTE + 2 * BEAT} caption="Search defects and reviews" />
          </div>
        </AbsoluteFill>
      }
    >
      <Screen cam={cam} shots={shots} />
    </FeatureFrame>
  );
};
