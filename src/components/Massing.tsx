import React from 'react';
import {COLORS} from '../config/theme';
import {clamp01} from '../lib/motion';

/**
 * The film's abstract "approved composition": a stack of horizontal strips
 * (floors) carrying a rhythm of openings. Every parameter is continuous so
 * wrong variants can morph into the approved one.
 */
export type MassingParams = {
  floors: number; // fractional values fade the top strip
  barW: number;
  barH: number;
  gap: number;
  /** 0 = approved dot rhythm, 1 = wrong slot rhythm */
  pattern: number;
};

export const APPROVED: MassingParams = {floors: 5, barW: 320, barH: 46, gap: 14, pattern: 0};
export const WRONG: MassingParams = {floors: 6, barW: 400, barH: 34, gap: 11, pattern: 1};

export const mixParams = (a: MassingParams, b: MassingParams, t: number): MassingParams => ({
  floors: a.floors + (b.floors - a.floors) * t,
  barW: a.barW + (b.barW - a.barW) * t,
  barH: a.barH + (b.barH - a.barH) * t,
  gap: a.gap + (b.gap - a.gap) * t,
  pattern: a.pattern + (b.pattern - a.pattern) * t,
});

export const massingHeight = (p: MassingParams) => Math.ceil(p.floors) * p.barH + (Math.ceil(p.floors) - 1) * p.gap;
export const barTop = (p: MassingParams, baseY: number, i: number) => baseY - (i + 1) * p.barH - i * p.gap;

export type MassingProps = {
  cx: number;
  baseY: number;
  params?: MassingParams;
  scale?: number;
  skew?: number;
  /** 0..1 bottom-up build */
  build?: number;
  /** 0..1 openings visibility */
  openings?: number;
  /** floors whose openings drop out (review error), with amount 0..1 */
  missing?: number[];
  missingP?: number;
  /** per-floor width multipliers (e.g. a wrong top floor) */
  widthMul?: (i: number) => number;
  /** 0 = solid ink, 1 = outline only */
  outline?: number;
  color?: string;
  openColor?: string;
  strokeW?: number;
  opacity?: number;
  /** horizontal offsets per floor (alignment snapping) */
  offsetX?: (i: number) => number;
};

export const Massing: React.FC<MassingProps> = ({
  cx,
  baseY,
  params = APPROVED,
  scale = 1,
  skew = 0,
  build = 1,
  openings = 1,
  missing = [],
  missingP = 0,
  widthMul,
  outline = 0,
  color = COLORS.ink,
  openColor = COLORS.highlight,
  strokeW = 3,
  opacity = 1,
  offsetX,
}) => {
  const {barW, barH, gap, pattern} = params;
  const n = Math.ceil(params.floors - 1e-6);
  const frac = params.floors - (n - 1);
  const bars: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const b = clamp01(build * n - i);
    if (b <= 0) continue;
    const top = i === n - 1 ? frac : 1;
    const w = barW * (widthMul ? widthMul(i) : 1);
    const y = baseY - (i + 1) * barH - i * gap;
    const x = cx - w / 2 + (offsetX ? offsetX(i) : 0);
    const vis = b * top;
    const op = clamp01(openings) * (missing.includes(i) ? 1 - missingP : 1);
    const holes: React.ReactNode[] = [];
    if (op > 0 && vis > 0.3) {
      if (pattern < 1) {
        const s = barH * 0.4;
        [-0.33, -0.11, 0.11, 0.33].forEach((k, j) =>
          holes.push(
            <rect
              key={`d${j}`}
              x={x + w / 2 + k * w - s / 2}
              y={y + barH / 2 - s / 2}
              width={s}
              height={s}
              rx={s * 0.18}
              fill={openColor}
              opacity={op * (1 - pattern)}
            />,
          ),
        );
      }
      if (pattern > 0) {
        const sw = w * 0.18;
        const sh = barH * 0.3;
        [-0.28, 0, 0.28].forEach((k, j) =>
          holes.push(
            <rect
              key={`s${j}`}
              x={x + w / 2 + k * w - sw / 2}
              y={y + barH / 2 - sh / 2}
              width={sw}
              height={sh}
              rx={sh / 2}
              fill={openColor}
              opacity={op * pattern}
            />,
          ),
        );
      }
    }
    bars.push(
      <g
        key={i}
        opacity={vis}
        transform={`translate(0 ${y + barH}) scale(1 ${0.2 + 0.8 * b}) translate(0 ${-(y + barH)})`}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={barH}
          rx={Math.min(6, barH * 0.14)}
          fill={color}
          fillOpacity={1 - outline}
          stroke={color}
          strokeWidth={outline > 0 ? strokeW : 0}
          strokeOpacity={outline}
        />
        {holes}
      </g>,
    );
  }
  return (
    <g
      opacity={opacity}
      transform={`translate(${cx} ${baseY}) skewX(${skew}) scale(${scale}) translate(${-cx} ${-baseY})`}
    >
      {bars}
    </g>
  );
};
