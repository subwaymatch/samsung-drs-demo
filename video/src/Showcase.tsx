import { linearTiming, TransitionSeries } from '@remotion/transitions';
import type { TransitionPresentation } from '@remotion/transitions';
import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile } from 'remotion';
import { CanvasBg } from './components/Backgrounds';
import { holeReveal, irisIn, navigate, rise, softPush } from './components/transitions';
import { DefectDetail } from './scenes/DefectDetail';
import { Devices } from './scenes/Devices';
import { Digests } from './scenes/Digests';
import { Duplicates } from './scenes/Duplicates';
import { Insights } from './scenes/Insights';
import { Intro } from './scenes/Intro';
import { Outro } from './scenes/Outro';
import { Review } from './scenes/Review';
import { Systems } from './scenes/Systems';
import { Team } from './scenes/Team';
import { Triage } from './scenes/Triage';
import { beats, C, SANS } from './theme';

export type ShowcaseProps = {
  /** Path of a music file in public/, e.g. "music/drs-theme.mp3". Leave empty for a silent render. */
  musicSrc: string;
  musicVolume: number;
  /** Frames to skip at the start of the track, to line its beats up with the cuts. */
  musicOffset: number;
  /** Optional credit and link on the closing card. */
  credit: string;
  url: string;
};

type Scene = {
  id: string;
  beats: number;
  render: (p: ShowcaseProps) => React.ReactNode;
  /** Transition into this scene and its length in beats. */
  enter?: [TransitionPresentation<any>, number];
};

// Lengths are in beats at 120 BPM (one beat = 15 frames, one 4/4 bar = 2 s).
// Each transition starts on a bar line, so a 33-bar, 66-second track at 120 BPM
// lines up with every section change. See README.md for the cue sheet.
export const SCENES: Scene[] = [
  { id: 'intro', beats: 10, render: () => <Intro /> },
  { id: 'devices', beats: 9, render: () => <Devices />, enter: [holeReveal(), 2] },
  { id: 'systems', beats: 13, render: () => <Systems />, enter: [rise(), 1] },
  { id: 'insights', beats: 17, render: () => <Insights />, enter: [rise(), 1] },
  { id: 'triage', beats: 17, render: () => <Triage />, enter: [navigate(), 1] },
  { id: 'duplicates', beats: 13, render: () => <Duplicates />, enter: [navigate(), 1] },
  { id: 'defect', beats: 17, render: () => <DefectDetail />, enter: [navigate(), 1] },
  { id: 'review', beats: 13, render: () => <Review />, enter: [navigate(), 1] },
  { id: 'digests', beats: 9, render: () => <Digests />, enter: [rise(), 1] },
  { id: 'team', beats: 14, render: () => <Team />, enter: [softPush(), 1] },
  { id: 'outro', beats: 12, render: p => <Outro credit={p.credit} url={p.url} />, enter: [irisIn(), 2] }
];


export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + beats(s.beats) - (s.enter ? beats(s.enter[1]) : 0), 0);

export const Showcase: React.FC<ShowcaseProps> = props => {
  const { musicSrc, musicVolume, musicOffset } = props;
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink, fontVariantLigatures: 'none', background: C.canvas }}>
      <CanvasBg />
      <TransitionSeries>
        {SCENES.flatMap(s => [
          ...(s.enter
            ? [<TransitionSeries.Transition key={s.id + '-in'} presentation={s.enter[0]} timing={linearTiming({ durationInFrames: beats(s.enter[1]) })} />]
            : []),
          <TransitionSeries.Sequence key={s.id} durationInFrames={beats(s.beats)} name={s.id}>
            {s.render(props)}
          </TransitionSeries.Sequence>
        ])}
      </TransitionSeries>
      {musicSrc ? (
        <Audio
          src={staticFile(musicSrc)}
          trimBefore={musicOffset}
          volume={f => interpolate(f, [0, 6, TOTAL_FRAMES - 30, TOTAL_FRAMES - 2], [0, musicVolume, musicVolume, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** One scene on its own, for previewing and rendering stills. */
export const SceneStage: React.FC<{ id: string }> = ({ id }) => {
  const s = SCENES.find(x => x.id === id)!;
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.ink, fontVariantLigatures: 'none', background: C.canvas }}>
      <CanvasBg />
      {s.render({ musicSrc: '', musicVolume: 0, musicOffset: 0, credit: '', url: '' })}
    </AbsoluteFill>
  );
};
