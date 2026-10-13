import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {AUDIO} from '../config/audio';
import {COLORS, FONT_FAMILY, VIDEO} from '../config/theme';

/** Full-frame SVG layer in screen coordinates. */
export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg
    width={VIDEO.width}
    height={VIDEO.height}
    viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`}
    style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}
  >
    {children}
  </svg>
);

/** Layer that applies a 2D virtual camera: zoom/rotate around a pivot, then pan. */
export const Camera: React.FC<{
  children: React.ReactNode;
  scale?: number;
  rotate?: number;
  x?: number;
  y?: number;
  pivot?: [number, number];
  style?: React.CSSProperties;
}> = ({children, scale = 1, rotate = 0, x = 0, y = 0, pivot = [VIDEO.width / 2, VIDEO.height / 2], style}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      transformOrigin: `${pivot[0]}px ${pivot[1]}px`,
      transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * The travelling blue thread as a free shape (pale-blue body with an optional
 * ink core). Used for every hand-off morph between scenes.
 */
export const Band: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  core?: number; // 0..1 visibility of the ink core line
  coreH?: number;
  coreVertical?: boolean;
  radius?: number;
  opacity?: number;
  color?: string;
  rotate?: number;
}> = ({left, top, width, height, core = 0, coreH = 4, coreVertical = false, radius = 8, opacity = 1, color = COLORS.highlight, rotate = 0}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      width,
      height,
      opacity,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
    }}
  >
    <div style={{position: 'absolute', inset: 0, background: color, borderRadius: Math.min(radius, height / 2, width / 2)}} />
    {core > 0 ? (
      coreVertical ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: width / 2 - coreH / 2,
            width: coreH,
            background: COLORS.ink,
            borderRadius: coreH,
            transformOrigin: 'bottom',
            transform: `scaleY(${core})`,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: height / 2 - coreH / 2,
            height: coreH,
            background: COLORS.ink,
            borderRadius: coreH,
            transform: `scaleX(${core})`,
          }}
        />
      )
    ) : null}
  </div>
);

/** Small label chip (Arabic), right-anchored by default. */
export const Tag: React.FC<{
  text: string;
  x: number;
  y: number;
  p: number; // reveal 0..1
  active?: number; // 0..1 chip fill
  size?: number;
  anchor?: 'right' | 'left' | 'center';
  index?: string;
  dim?: number;
}> = ({text, x, y, p, active = 1, size = 38, anchor = 'right', index, dim = 0}) => {
  if (p <= 0) return null;
  const pos: React.CSSProperties =
    anchor === 'right'
      ? {right: VIDEO.width - x}
      : anchor === 'left'
        ? {left: x}
        : {left: x, transform: 'translateX(-50%)'};
  return (
    <div style={{position: 'absolute', top: y - size * 0.85, ...pos, opacity: 1 - dim * 0.55}}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.35,
          direction: 'rtl',
          padding: `${size * 0.16}px ${size * 0.42}px ${size * 0.24}px`,
          borderRadius: size * 0.22,
          background: `rgba(216,229,255,${active})`,
          border: `2px solid ${COLORS.ink}`,
          clipPath: `inset(-10% 0 -10% ${(1 - p) * 100}%)`,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.25,
          color: COLORS.ink,
          whiteSpace: 'nowrap',
        }}
      >
        {index ? (
          <span style={{fontSize: size * 0.6, fontWeight: 500, opacity: 0.7, direction: 'ltr'}}>{index}</span>
        ) : null}
        <span>{text}</span>
      </div>
    </div>
  );
};

export type SfxName = 'tick' | 'click' | 'impact' | 'swoosh' | 'sweep' | 'align' | 'error' | 'pop' | 'resolve' | 'whoosh' | 'thud';

/** One-shot sound effect placed on the scene's local timeline. */
export const Sfx: React.FC<{at: number; name: SfxName; volume?: number; rate?: number}> = ({at, name, volume = 1, rate = 1}) =>
  !AUDIO.enabled ? null : (
  <Sequence from={Math.round(at)} durationInFrames={90} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`audio/sfx-${name}.wav`)} volume={volume * AUDIO.sfxVolume} playbackRate={rate} />
  </Sequence>
);
