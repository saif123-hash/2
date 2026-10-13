import React from 'react';
import {COLORS} from '../config/theme';
import {clamp01} from '../lib/motion';

/** Diagonal architectural hatch, used to mark anything that is NOT approved. */
export const HatchDefs: React.FC<{id: string; color?: string; spacing?: number; width?: number}> = ({
  id,
  color = COLORS.ink,
  spacing = 12,
  width = 2.2,
}) => (
  <defs>
    <pattern id={id} patternUnits="userSpaceOnUse" width={spacing} height={spacing} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={spacing} stroke={color} strokeWidth={width} />
    </pattern>
  </defs>
);

/** Check badge: ring + stroke-drawn tick. */
export const CheckBadge: React.FC<{x: number; y: number; r?: number; p: number; filled?: boolean}> = ({x, y, r = 24, p, filled = true}) => {
  if (p <= 0) return null;
  const ring = clamp01(p * 1.6);
  const tick = clamp01(p * 1.6 - 0.6);
  const len = r * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * ring})`} opacity={ring}>
      <circle r={r} fill={filled ? COLORS.highlight : 'none'} stroke={COLORS.ink} strokeWidth={3} />
      <path
        d={`M ${-r * 0.42} ${r * 0.02} L ${-r * 0.1} ${r * 0.34} L ${r * 0.46} ${-r * 0.3}`}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={r * 0.17}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - tick)}
      />
    </g>
  );
};

/** Cross mark drawn with two strokes. */
export const CrossMark: React.FC<{x: number; y: number; size?: number; p: number; w?: number}> = ({x, y, size = 60, p, w = 7}) => {
  if (p <= 0) return null;
  const a = clamp01(p * 2);
  const b = clamp01(p * 2 - 1);
  const h = size / 2;
  const L = size * Math.SQRT2;
  return (
    <g transform={`translate(${x} ${y})`} stroke={COLORS.ink} strokeWidth={w} strokeLinecap="round">
      <line x1={h} y1={-h} x2={-h} y2={h} strokeDasharray={L} strokeDashoffset={L * (1 - a)} />
      <line x1={-h} y1={-h} x2={h} y2={h} strokeDasharray={L} strokeDashoffset={L * (1 - b)} />
    </g>
  );
};

/** Viewfinder corner brackets around a rect. */
export const Brackets: React.FC<{x: number; y: number; w: number; h: number; len?: number; sw?: number; rotate?: number; opacity?: number; color?: string}> = ({
  x,
  y,
  w,
  h,
  len = 46,
  sw = 4,
  rotate = 0,
  opacity = 1,
  color = COLORS.ink,
}) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const d = [
    `M ${x} ${y + len} L ${x} ${y} L ${x + len} ${y}`,
    `M ${x + w - len} ${y} L ${x + w} ${y} L ${x + w} ${y + len}`,
    `M ${x + w} ${y + h - len} L ${x + w} ${y + h} L ${x + w - len} ${y + h}`,
    `M ${x + len} ${y + h} L ${x} ${y + h} L ${x} ${y + h - len}`,
  ].join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="square"
      opacity={opacity}
      transform={`rotate(${rotate} ${cx} ${cy})`}
    />
  );
};
