import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile} from 'remotion';
import {AUDIO} from './config/audio';
import {COLORS} from './config/theme';
import {SCENE_DURATIONS, SCENE_ORDER, SCENE_START, SceneId} from './config/timeline';
import {Chrome} from './overlay/Chrome';
import {Finish} from './overlay/Overlays';
import {S1Hook} from './scenes/S1Hook';
import {S2Reference} from './scenes/S2Reference';
import {S3Camera} from './scenes/S3Camera';
import {S4Enhance} from './scenes/S4Enhance';
import {S5Review} from './scenes/S5Review';
import {S6Brand} from './scenes/S6Brand';

const SCENES: Record<SceneId, React.FC> = {
  s1: S1Hook,
  s2: S2Reference,
  s3: S3Camera,
  s4: S4Enhance,
  s5: S5Review,
  s6: S6Brand,
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.bg}}>
    {SCENE_ORDER.map((id) => {
      const Scene = SCENES[id];
      return (
        <Sequence key={id} from={SCENE_START[id]} durationInFrames={SCENE_DURATIONS[id]} name={id}>
          <Scene />
        </Sequence>
      );
    })}
    <Finish />
    <Chrome />
    {AUDIO.enabled ? <Html5Audio src={staticFile('audio/music.wav')} volume={AUDIO.musicVolume} /> : null}
  </AbsoluteFill>
);
