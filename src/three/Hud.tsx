import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, VIDEO} from '../config/theme';
import {EASE, prog} from '../lib/motion';
import {Line3D} from './Text3D';

/** Flat ink rectangle in HUD pixel space (CSS-like rect: left/top/width/height). */
export const HudRect: React.FC<{x: number; y: number; w: number; h: number; color?: string; z?: number; opacity?: number}> = ({x, y, w, h, color = COLORS.ink, z = 0, opacity = 1}) =>
  w <= 0 || h <= 0 || opacity <= 0 ? null : (
    <mesh position={[x + w / 2, -(y + h / 2), z]} renderOrder={1002}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} fog={false} toneMapped={false} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );

/** Viewfinder corners around a screen rect, in HUD space. */
export const HudBrackets: React.FC<{x: number; y: number; w: number; h: number; len?: number; t?: number; opacity?: number}> = ({x, y, w, h, len = 56, t = 6, opacity = 1}) => {
  if (opacity <= 0) return null;
  const c: [number, number, number, number][] = [
    [x, y, len, t],
    [x, y, t, len],
    [x + w - len, y, len, t],
    [x + w - t, y, t, len],
    [x, y + h - t, len, t],
    [x, y + h - len, t, len],
    [x + w - len, y + h - t, len, t],
    [x + w - t, y + h - len, t, len],
  ];
  return (
    <>
      {c.map(([a, b, cw, ch], i) => (
        <HudRect key={i} x={a} y={b} w={cw} h={ch} opacity={opacity} />
      ))}
    </>
  );
};

export const SCREEN = {w: VIDEO.width, h: VIDEO.height};

/**
 * Small pinned chip (e.g. «التصميم المعتمد» / «AI») with a pale slab and a
 * short leader line down to its 3D anchor at (x, y).
 */
export const Chip: React.FC<{text: string; x: number; y: number; at: number; until?: number; size?: number; leader?: number; dark?: boolean}> = ({
  text,
  x,
  y,
  at,
  until,
  size = 40,
  leader = 56,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const f = useCurrentFrame();
  const ltr = /^[A-Za-z0-9 .]+$/.test(text);
  const v = prog(f, at, 8, EASE.out) * (until === undefined ? 1 : 1 - prog(f, until, 8, EASE.in));
  return (
    <>
      {v > 0 ? <HudRect x={x - 2.5} y={y - leader * v} w={5} h={leader * v} /> : null}
      {v > 0 ? <HudRect x={x - 7} y={y - 7} w={14} h={14} opacity={v} /> : null}
      <Line3D
        text={text}
        x={x}
        y={y - leader - size * 0.7}
        align="center"
        size={size}
        weight={700}
        depth={8}
        dir={ltr ? 'ltr' : 'rtl'}
        inAt={at}
        inDur={10}
        mode="flip"
        hl={{at: at + 2, dur: 8, depth: 6, outAt: until, outDur: 8}}
        outAt={until}
        outMode="flipOut"
      />
    </>
  );
};
