import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { camAt, frame as framed, rectToScreen, toScreen } from '../components/camera';
import { FeatureFrame } from '../components/FeatureFrame';
import { Spotlight, window01 } from '../components/Overlays';
import { Pointer, pointerAt } from '../components/Pointer';
import { Screen } from '../components/Screen';
import { cap, L } from '../layout';
import { Clicks, Keystrokes } from '../components/Sfx';

const N = L.newDefect;
// Frames 1-5 type the title word by word, 6 opens the model picker, 7 shows the duplicates.
const TYPE = [30, 38, 46, 54, 62];
const OPEN = 88;
const PICK = 104;

export const Duplicates: React.FC = () => {
  const f = useCurrentFrame();
  const shown = f >= PICK ? 7 : f >= OPEN ? 6 : TYPE.filter(t => f >= t).length;
  const form = { x: N.titleBox.x - 24, y: N.titleBox.y - 40, w: N.titleBox.width + 48, h: 280 };
  const withDupes = { x: form.x, y: form.y, w: form.w, h: N.dupes.y + N.dupes.h - form.y + 24 };
  const cam = camAt(f, [
    { at: 0, zoom: 1, fx: 800, fy: 450 },
    { at: 16 },
    { at: 34, ...framed(form, 0, 24) },
    { at: PICK + 2 },
    { at: PICK + 22, ...framed(withDupes, 0, 24) }
  ]);

  const model = { x: N.modelBox.x + 90, y: N.modelBox.y + N.modelBox.height / 2 };
  const option = { x: N.modelBox.x + 70, y: N.modelBox.y + 76 };
  const ptr = pointerAt(f, [
    { at: OPEN - 22, x: model.x + 260, y: model.y + 140 },
    { at: OPEN - 6, x: model.x, y: model.y },
    { at: OPEN + 6, x: model.x, y: model.y },
    { at: PICK - 4, x: option.x, y: option.y },
    { at: PICK + 24, x: option.x + 300, y: option.y + 260 }
  ]);
  const p = toScreen(cam, ptr.x, ptr.y);
  const ptrOpacity = Math.min(interpolate(f, [OPEN - 24, OPEN - 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), interpolate(f, [PICK + 12, PICK + 22], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <FeatureFrame
      stage={
        <>
          {/* Typing the title, then a click on the model field, the model number, and a click on the match. */}
          <Keystrokes at={Array.from({ length: 20 }, (_, i) => 14 + i * 2.5)} />
          <Clicks at={[OPEN - 4, PICK - 2]} />
          <Keystrokes at={[OPEN - 2, OPEN, OPEN + 1, OPEN + 3]} seed={5} />
        </>
      }
      navigated
      index="03"
      label="Report"
      title="Duplicates caught before they're filed"
      windowTitle="Report a defect - DRS"
      chips={[
        { label: 'Similar title', on: [TYPE[1], 400] },
        { label: 'Same model', on: [PICK, 400] }
      ]}
    >
      <Screen
        cam={cam}
        shots={Array.from({ length: N.frames }, (_, i) => ({ src: cap(`newdefect-${i}`), on: shown === i, mount: Math.abs(i - shown) <= 1 }))}
        overlay={
          <>
            <Spotlight r={rectToScreen(cam, { x: N.dupes.x - 8, y: N.dupes.y - 6, w: N.dupes.w + 16, h: N.dupes.h + 12 })} p={window01(f, PICK + 22, 400)} label="Possible duplicate: D-17-0363, in progress" below dim={0.22} />
            <Pointer x={p.x} y={p.y} frame={f} clicks={[OPEN - 4, PICK - 2]} opacity={ptrOpacity} />
          </>
        }
      />
    </FeatureFrame>
  );
};
