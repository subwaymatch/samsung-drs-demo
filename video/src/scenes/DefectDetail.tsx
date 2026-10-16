import React from 'react';
import { useCurrentFrame } from 'remotion';
import { camAt, frame as framed, pad, rectToScreen, scrollToShow } from '../components/camera';
import { FeatureFrame } from '../components/FeatureFrame';
import { Spotlight, window01 } from '../components/Overlays';
import { Screen } from '../components/Screen';
import { cap, L } from '../layout';

const D = L.defect;

export const DefectDetail: React.FC = () => {
  const f = useCurrentFrame();
  const recScroll = D.records.y - 60;
  const mapScroll = D.relmap.y - 70;
  const cam = camAt(f, [
    { at: 0, scroll: 0, zoom: 1, fx: 800, fy: 450 },
    { at: 26 },
    { at: 48, ...framed(pad(D.targets, 20), scrollToShow(D.targets), 40) },
    { at: 92 },
    { at: 122, ...framed(D.records, recScroll, 90) },
    { at: 160 },
    { at: 192, ...framed(D.relmap, mapScroll, 90) }
  ]);

  return (
    <FeatureFrame
      navigated
      index="04"
      label="Defects"
      title="Every defect, in full context"
      windowTitle={`${D.id} - DRS`}
      chips={[
        { label: 'Severity targets', on: [50, 96] },
        { label: 'Records in every system', on: [124, 164] },
        { label: 'Relationship map', on: [194, 400] }
      ]}
    >
      <Screen
        cam={cam}
        sidebar={cap('defect-top')}
        shots={[{ src: cap('defect-full'), on: true }]}
        overlay={
          <>
            <Spotlight r={rectToScreen(cam, pad(D.targets, 14))} p={window01(f, 54, 90)} label="Critical: respond in 4 hours, resolve in 2 days" tone="danger" dim={0.2} />
            <Spotlight r={rectToScreen(cam, pad(D.records, 10))} p={window01(f, 128, 158)} label="One defect, linked from ClearQuest to Jira" dim={0.16} />
            <Spotlight r={rectToScreen(cam, pad(D.relmap, 8))} p={window01(f, 198, 400)} label="Related defects, reviews and product lines" dim={0.12} />
          </>
        }
      />
    </FeatureFrame>
  );
};
