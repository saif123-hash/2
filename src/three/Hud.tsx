import React from 'react';
import {COLORS, VIDEO} from '../config/theme';

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

/** Ink cross (✗) drawn in HUD space, centred on (x, y). */
export const HudCross: React.FC<{x: number; y: number; size?: number; t?: number; p?: number}> = ({x, y, size = 40, t = 7, p = 1}) =>
  p <= 0 ? null : (
    <group position={[x, -y, 2]} scale={p}>
      {[45, -45].map((a) => (
        <mesh key={a} rotation={[0, 0, (a * Math.PI) / 180]} renderOrder={1003}>
          <planeGeometry args={[t, size * 1.3]} />
          <meshBasicMaterial color={COLORS.ink} fog={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
