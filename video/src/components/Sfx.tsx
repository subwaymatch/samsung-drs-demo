import React, { createContext, useContext } from 'react';
import { Audio, Sequence, staticFile } from 'remotion';

/**
 * Sound effect levels, set against the music's loudness at each cue (see
 * README.md): about 6 to 8 dB under the music, so they are heard without
 * standing out. Clicks and keys are also soft-clipped in sfx:prep to lift them.
 */
export const SFX_LEVEL = { whoosh: 0.54, connect: 0.7, highlight: 0.46, click: 0.85, key: 0.5 };

/** Master level for all sound effects; 0 leaves them out. */
export const SfxVolume = createContext(1);

/** One sound effect from public/sfx/, starting at frame `at` of the enclosing scene. */
export const Sfx: React.FC<{ at: number; name: string; volume: number; frames?: number }> = ({ at, name, volume, frames = 60 }) => {
  const master = useContext(SfxVolume);
  if (!master) return null;
  return (
    <Sequence from={Math.round(at)} durationInFrames={frames} layout="none" name={'sfx ' + name}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume * master} />
    </Sequence>
  );
};

/**
 * Key presses at the given frames, cycling through the recorded keys with small
 * level changes so repeated keys do not sound mechanical.
 */
export const Keystrokes: React.FC<{ at: number[]; seed?: number; level?: number }> = ({ at, seed = 0, level = 1 }) => (
  <>
    {at.map((t, i) => (
      <Sfx key={i} at={t} name={`key-${((i + seed) * 5 + 3) % 8 + 1}`} volume={SFX_LEVEL.key * level * (0.85 + 0.075 * (((i + seed) * 7) % 3))} frames={5} />
    ))}
  </>
);

/** Clicks at the given frames, in time with the pointer's click ripple. */
export const Clicks: React.FC<{ at: number[] }> = ({ at }) => (
  <>
    {at.map((t, i) => <Sfx key={i} at={t} name="click" volume={SFX_LEVEL.click} frames={5} />)}
  </>
);

/** Frames for `n` keys typed evenly, `gap` frames apart, the last one landing on `end`. */
export const typed = (end: number, n: number, gap = 2.5) => Array.from({ length: n }, (_, i) => end - (n - 1 - i) * gap);
