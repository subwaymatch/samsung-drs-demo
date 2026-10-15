import React from 'react';
import { Composition, Folder } from 'remotion';
import './fonts';
import { SceneStage, SCENES, Showcase, TOTAL_FRAMES, type ShowcaseProps } from './Showcase';
import { beats, FPS, HEIGHT, WIDTH } from './theme';

const defaults: ShowcaseProps = { musicSrc: '', musicVolume: 0.8, credit: '', url: '' };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="DrsShowcase" component={Showcase} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={defaults} />
    <Folder name="Scenes">
      {SCENES.map(s => (
        <Composition key={s.id} id={`Scene-${s.id}`} component={SceneStage} durationInFrames={beats(s.beats)} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ id: s.id }} />
      ))}
    </Folder>
  </>
);
