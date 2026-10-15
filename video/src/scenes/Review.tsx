import React from 'react';
import { useCurrentFrame } from 'remotion';
import { camAt, frame as framed, pad, rectToScreen } from '../components/camera';
import { FeatureFrame } from '../components/FeatureFrame';
import { Spotlight, window01 } from '../components/Overlays';
import { Screen } from '../components/Screen';
import { cap, L } from '../layout';

const R = L.review;
// The first file's hunk and its inline comment (from the capture), and the approval in the activity log.
const HUNK = { x: R.diff.x, y: R.diff.y + 86, w: R.diff.w, h: 300 };
const COMMENT = { x: R.diff.x + 2, y: R.diff.y + 276, w: R.diff.w - 4, h: 72 };
const APPROVAL = { x: R.diff.x, y: R.approved.y - 42, w: R.diff.w, h: 80 };

const Check: React.FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const Review: React.FC = () => {
  const f = useCurrentFrame();
  const diffScroll = R.diff.y - 40;
  const actScroll = APPROVAL.y - 330;
  const cam = camAt(f, [
    { at: 0, scroll: 0, zoom: 1, fx: 800, fy: 450 },
    { at: 20 },
    { at: 40, ...framed(pad(R.turnaround, 16), 0, 40) },
    { at: 70 },
    { at: 96, ...framed(HUNK, diffScroll, 30) },
    { at: 128 },
    { at: 150, ...framed(APPROVAL, actScroll, 40) }
  ]);

  return (
    <FeatureFrame
      navigated
      index="05"
      label="Code review"
      title="Code review, built in"
      windowTitle={`${R.id} - DRS`}
      chips={[
        { label: 'Turnaround', on: [42, 72] },
        { label: 'Line comments', on: [98, 130] },
        { label: 'Reviewer decisions', on: [152, 400] }
      ]}
    >
      <Screen
        cam={cam}
        sidebar={cap('review-top')}
        shots={[{ src: cap('review-full'), on: true }]}
        overlay={
          <>
            <Spotlight r={rectToScreen(cam, pad(R.turnaround, 14))} p={window01(f, 44, 68)} label="7.4 hours to first decision, target 48" below dim={0.2} />
            <Spotlight r={rectToScreen(cam, COMMENT)} p={window01(f, 100, 126)} label="Comments on the exact line" below dim={0.2} radius={6} />
            <Spotlight
              r={rectToScreen(cam, APPROVAL)}
              p={window01(f, 154, 400)}
              tone="good"
              dim={0.2}
              label={
                <>
                  <Check />
                  Approved by the code review team
                </>
              }
            />
          </>
        }
      />
    </FeatureFrame>
  );
};
