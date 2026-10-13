import React from 'react';
import {AbsoluteFill, Html5Audio, Img, Sequence, staticFile} from 'remotion';
import {AUDIO} from '../config/audio';
import {COLORS, VIDEO} from '../config/theme';

/** Fine print grain + soft lens vignette over the whole film. */
export const Finish: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(25,50,77,0) 55%, rgba(25,50,77,0.10) 100%)',
      }}
    />
    <Img
      src={staticFile('brand/grain.png')}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.05, mixBlendMode: 'multiply'}}
    />
  </AbsoluteFill>
);

/** Screen-space pale-blue panel (the highlight as a full-frame wipe). */
export const Panel: React.FC<{left: number; top: number; width: number; height: number; color?: string; core?: number; radius?: number; rotate?: number}> = ({
  left,
  top,
  width,
  height,
  color = COLORS.highlight,
  core = 0,
  radius = 6,
  rotate = 0,
}) => (
  <div style={{position: 'absolute', left, top, width, height, transform: rotate ? `rotate(${rotate}deg)` : undefined}}>
    <div style={{position: 'absolute', inset: 0, background: color, borderRadius: Math.min(radius, height / 2, width / 2)}} />
    {core > 0 ? (
      <div style={{position: 'absolute', left: 0, right: 0, top: height / 2 - 2.5, height: 5, background: COLORS.ink, borderRadius: 3, transform: `scaleX(${core})`}} />
    ) : null}
  </div>
);

/** Speed streaks for whip moves: thin ink lines racing across the frame. */
export const Streaks: React.FC<{p: number; angle?: number; count?: number; seed?: number; opacity?: number}> = ({p, angle = -12, count = 22, seed = 3, opacity = 1}) => {
  if (p <= 0 || p >= 1) return null;
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const env = Math.sin(p * Math.PI);
  return (
    <div style={{position: 'absolute', inset: -400, transform: `rotate(${angle}deg)`, pointerEvents: 'none', opacity: opacity * env}}>
      {Array.from({length: count}, (_, i) => {
        const y = r() * (VIDEO.height + 800);
        const len = 300 + r() * 900;
        const speed = 0.7 + r() * 0.8;
        const x = -len + (VIDEO.width + 800 + len * 2) * ((p * speed + r()) % 1);
        const th = 2 + r() * 5;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: len, height: th, background: r() > 0.4 ? COLORS.ink : COLORS.highlight, borderRadius: th}} />;
      })}
    </div>
  );
};

export type SfxName = 'tick' | 'click' | 'impact' | 'swoosh' | 'sweep' | 'align' | 'error' | 'pop' | 'resolve' | 'whoosh' | 'thud' | 'riser' | 'slam';

/** One-shot sound effect placed on the scene's local timeline. */
export const Sfx: React.FC<{at: number; name: SfxName; volume?: number; rate?: number}> = ({at, name, volume = 1, rate = 1}) =>
  !AUDIO.enabled ? null : (
    <Sequence from={Math.round(at)} durationInFrames={100} layout="none" name={`sfx:${name}`}>
      <Html5Audio src={staticFile(`audio/sfx-${name}.wav`)} volume={volume * AUDIO.sfxVolume} playbackRate={rate} />
    </Sequence>
  );
