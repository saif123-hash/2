import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ArLine} from '../components/ArLine';
import {Brackets} from '../components/Marks';
import {Sfx, Svg, Tag} from '../components/Primitives';
import {COPY} from '../config/copy';
import {COLORS, FONT_FAMILY, TEXT_RIGHT} from '../config/theme';
import {HANDOFF} from '../config/timeline';
import {Cam, pathOf, project} from '../lib/project';
import {EASE, Key, lerp, prog, shake, track} from '../lib/motion';
import {GRID} from './S2Reference';
import {S4_BAR_CENTERS} from './S4Enhance';

// ── Scene 03 · Camera vs. design ──────────────────────────────────────
// A true perspective plane orbits through three viewpoints. The anchored
// markers (windows, balconies, entrance) and the relations between them
// never move on the plane — only the viewpoint does.

const L1 = {y: 214, size: 100};
const L2 = {y: 350, size: 132};
const LINE2_AT = 66;
const OUT = 130;
const LINES_AT = 140;
const END = 172;
const LINE_ANGLE = -16;

const WINDOWS: [number, number][] = [
  [-180, -240],
  [180, -240],
  [-180, -120],
  [180, -120],
];
const BALCONIES: [number, number, number][] = [
  // x0, x1, y
  [-300, -60, 60],
  [60, 300, 60],
];
const ENTRANCE: [number, number] = [0, 270];

export const S3Camera: React.FC = () => {
  const f = useCurrentFrame();

  const yawK: Key[] = [
    [12, 0],
    [42, -36],
    [58, -36],
    [86, 30],
    [98, 30],
    [120, 0],
  ];
  const pitchK: Key[] = [
    [12, 0],
    [42, 16],
    [58, 16],
    [86, -12],
    [98, -12],
    [120, 0],
  ];
  const rollK: Key[] = [
    [12, 0],
    [42, -4],
    [58, -4],
    [86, 3],
    [98, 3],
    [120, 0],
  ];
  const zoomK: Key[] = [
    [12, 1],
    [42, 0.92],
    [86, 0.95],
    [120, 1],
  ];
  const cam: Cam = {
    yaw: track(f, yawK),
    pitch: track(f, pitchK),
    roll: track(f, rollK),
    dist: 1500,
    zoom: track(f, zoomK),
    cx: 540 + shake(f, LINE2_AT + 8, 6, 10),
    cy: HANDOFF.gridCenterY + shake(f + 2, LINE2_AT + 8, 8, 10),
  };
  const P = (x: number, y: number) => {
    const [sx, sy] = project(x, y, 0, cam);
    return [sx, sy] as [number, number];
  };

  const {cell, halfX, halfY} = GRID;
  const markOp = 1 - prog(f, OUT - 6, 12, EASE.in);

  // vertical grid lines retract at the end; horizontal ones become directional lines
  const vRetract = prog(f, LINES_AT - 4, 14, EASE.in);
  const L = prog(f, LINES_AT, END - LINES_AT, EASE.inOut);

  const vLines: React.ReactNode[] = [];
  for (let x = -halfX; x <= halfX; x += cell) {
    const h = halfY * (1 - vRetract);
    if (h <= 0) continue;
    vLines.push(<path key={`v${x}`} d={pathOf([P(x, -h), P(x, h)])} />);
  }

  // horizontal lines: indices 1..5 map onto Scene 04's five bars, the rest leave
  const hLines: React.ReactNode[] = [];
  const ys: number[] = [];
  for (let y = -halfY; y <= halfY; y += cell) ys.push(y);
  ys.forEach((y, k) => {
    const target = k >= 1 && k <= 5 ? S4_BAR_CENTERS[k - 1] : null;
    if (L <= 0) {
      hLines.push(<path key={`h${y}`} d={pathOf([P(-halfX, y), P(halfX, y)])} />);
      return;
    }
    const [ax, ay] = P(-halfX, y);
    const [bx, by] = P(halfX, y);
    const cx0 = (ax + bx) / 2;
    const cy0 = (ay + by) / 2;
    const len = lerp(Math.hypot(bx - ax, by - ay), 1800, L);
    const ang = (lerp(0, LINE_ANGLE, L) * Math.PI) / 180;
    const cy1 = target ?? cy0 + (k === 0 ? -900 : 900);
    const cx = lerp(cx0, 540, L);
    const cy = lerp(cy0, cy1, L);
    const dx = (Math.cos(ang) * len) / 2;
    const dy = (Math.sin(ang) * len) / 2;
    hLines.push(
      <line
        key={`h${y}`}
        x1={cx - dx}
        y1={cy - dy}
        x2={cx + dx}
        y2={cy + dy}
        strokeWidth={lerp(2.5, 6, L)}
        opacity={target === null ? 1 - L : 1}
      />,
    );
  });

  // projected bounding box of the plane → viewfinder brackets
  const corners = [P(-halfX, -halfY), P(halfX, -halfY), P(halfX, halfY), P(-halfX, halfY)];
  const bx0 = Math.min(...corners.map((c) => c[0])) - 34;
  const bx1 = Math.max(...corners.map((c) => c[0])) + 34;
  const by0 = Math.min(...corners.map((c) => c[1])) - 34;
  const by1 = Math.max(...corners.map((c) => c[1])) + 34;
  const brP = prog(f, 10, 14, EASE.out) * markOp;

  const square = (cx: number, cy: number, s: number) =>
    pathOf([P(cx - s / 2, cy - s / 2), P(cx + s / 2, cy - s / 2), P(cx + s / 2, cy + s / 2), P(cx - s / 2, cy + s / 2)], true);
  const rect = (x0: number, x1: number, cy: number, h: number) =>
    pathOf([P(x0, cy - h / 2), P(x1, cy - h / 2), P(x1, cy + h / 2), P(x0, cy + h / 2)], true);
  const diamond = (cx: number, cy: number, s: number) => pathOf([P(cx, cy - s), P(cx + s, cy), P(cx, cy + s), P(cx - s, cy)], true);
  const ring = (cx: number, cy: number, r: number) =>
    pathOf(
      Array.from({length: 33}, (_, i) => {
        const a = (i / 32) * Math.PI * 2;
        return P(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }),
      true,
    );

  const wP = prog(f, 16, 12, EASE.out);
  const bP = prog(f, 26, 12, EASE.out);
  const eP = prog(f, 36, 12, EASE.out);
  const relP = prog(f, 44, 16, EASE.inOut);

  // label anchors follow the markers through every viewpoint
  const wA = P(180, -240 - 36);
  const bA = P(300, 60);
  const eA = P(0, 270 + 60);
  const tagP = (at: number) => prog(f, at, 12, EASE.out) * markOp;

  // angle readout
  const yaw = cam.yaw;
  const dialP = prog(f, 14, 12) * markOp;
  const dial = {x: 540, y: 1610, r: 74};
  const needle = ((-90 + yaw * 2) * Math.PI) / 180;

  return (
    <AbsoluteFill>
      <Svg>
        <g stroke={COLORS.ink} strokeWidth={2.5} fill="none" opacity={1}>
          {vLines}
          {hLines}
        </g>

        <g opacity={markOp}>
          {/* relations between anchored elements (fixed on the plane) */}
          {relP > 0 ? (
            <g stroke={COLORS.ink} strokeWidth={2.5} strokeDasharray="6 7" fill="none" opacity={0.75}>
              <path d={pathOf([P(-180, -120), P(-180, 60)])} strokeDasharray={`${relP * 300} 999`} />
              <path d={pathOf([P(180, -120), P(180, 60)])} />
              <path d={pathOf([P(-180, 60), P(0, 270), P(180, 60)])} />
            </g>
          ) : null}
          {/* windows */}
          {WINDOWS.map(([x, y], i) => {
            const t = Math.min(1, Math.max(0, wP * 1.6 - i * 0.2));
            return t > 0 ? <path key={i} d={square(x, y, 76 * t)} fill={COLORS.highlight} stroke={COLORS.ink} strokeWidth={3.5} /> : null;
          })}
          {/* balconies */}
          {BALCONIES.map(([x0, x1, y], i) => {
            const t = Math.min(1, Math.max(0, bP * 1.5 - i * 0.3));
            return t > 0 ? <path key={i} d={rect(x0, lerp(x0, x1, t), y, 34)} fill={COLORS.ink} /> : null;
          })}
          {/* entrance */}
          {eP > 0 ? (
            <g>
              <path d={ring(ENTRANCE[0], ENTRANCE[1], 64 * eP)} fill="none" stroke={COLORS.ink} strokeWidth={3} />
              <path d={diamond(ENTRANCE[0], ENTRANCE[1], 34 * eP)} fill={COLORS.ink} />
            </g>
          ) : null}

          {/* leader lines to the screen-space labels */}
          <g stroke={COLORS.ink} strokeWidth={2.5}>
            {tagP(30) > 0 ? <line x1={wA[0]} y1={wA[1]} x2={wA[0] + 30} y2={wA[1] - 46 * tagP(30)} /> : null}
            {tagP(40) > 0 ? <line x1={bA[0]} y1={bA[1]} x2={bA[0] + 28} y2={bA[1] + 52 * tagP(40)} /> : null}
            {tagP(50) > 0 ? <line x1={eA[0]} y1={eA[1] - 24} x2={eA[0]} y2={eA[1] + 30 * tagP(50)} /> : null}
          </g>

          <Brackets x={bx0} y={by0} w={bx1 - bx0} h={by1 - by0} opacity={brP} len={52} sw={5} />

          {/* viewpoint dial */}
          {dialP > 0 ? (
            <g opacity={dialP} stroke={COLORS.ink} fill="none">
              <path d={`M ${dial.x - dial.r} ${dial.y} A ${dial.r} ${dial.r} 0 0 1 ${dial.x + dial.r} ${dial.y}`} strokeWidth={3} />
              {[-60, -30, 0, 30, 60].map((a) => {
                const r = ((-90 + a) * Math.PI) / 180;
                return (
                  <line
                    key={a}
                    x1={dial.x + Math.cos(r) * (dial.r - 10)}
                    y1={dial.y + Math.sin(r) * (dial.r - 10)}
                    x2={dial.x + Math.cos(r) * dial.r}
                    y2={dial.y + Math.sin(r) * dial.r}
                    strokeWidth={3}
                  />
                );
              })}
              <line x1={dial.x} y1={dial.y} x2={dial.x + Math.cos(needle) * (dial.r - 4)} y2={dial.y + Math.sin(needle) * (dial.r - 4)} strokeWidth={5} strokeLinecap="round" />
              <circle cx={dial.x} cy={dial.y} r={9} fill={COLORS.highlight} strokeWidth={3} />
              <text
                x={dial.x}
                y={dial.y + 50}
                textAnchor="middle"
                fontFamily={FONT_FAMILY}
                fontWeight={700}
                fontSize={30}
                fill={COLORS.ink}
                stroke="none"
                style={{fontVariantNumeric: 'tabular-nums'}}
              >
                {`${Math.round(yaw) > 0 ? '+' : ''}${Math.round(yaw)}°`}
              </text>
            </g>
          ) : null}
        </g>
      </Svg>

      <Tag text={COPY.s3.labels[0]} x={wA[0] + 30 + 8} y={wA[1] - 60} anchor="left" p={tagP(30)} size={36} />
      <Tag text={COPY.s3.labels[1]} x={bA[0] + 30} y={bA[1] + 110} anchor="center" p={tagP(40)} size={36} />
      <Tag text={COPY.s3.labels[2]} x={eA[0]} y={eA[1] + 82} anchor="center" p={tagP(50)} size={36} />

      <ArLine text={COPY.s3.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={4} stagger={4} inDur={20} mode="slide" outAt={OUT} outMode="rise" />
      <ArLine
        text={COPY.s3.line2}
        x={TEXT_RIGHT}
        y={L2.y}
        size={L2.size}
        inAt={LINE2_AT}
        inDur={14}
        stagger={4}
        mode="scale"
        hl={{at: LINE2_AT + 6, dur: 12, outAt: OUT + 2, outDur: 10}}
        outAt={OUT + 2}
        outMode="rise"
      />

      <Sfx at={14} name="swoosh" volume={0.4} />
      <Sfx at={16} name="tick" />
      <Sfx at={26} name="tick" rate={1.1} />
      <Sfx at={36} name="tick" rate={1.2} />
      <Sfx at={58} name="click" volume={0.6} />
      <Sfx at={98} name="click" volume={0.5} rate={1.1} />
      <Sfx at={LINE2_AT + 6} name="impact" volume={0.55} />
      <Sfx at={LINES_AT} name="sweep" volume={0.5} />
    </AbsoluteFill>
  );
};
