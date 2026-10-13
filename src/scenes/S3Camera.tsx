import React from 'react';
import {Line} from '@react-three/drei';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT} from '../config/theme';
import {EASE, clamp01, lerp, prog} from '../lib/motion';
import {Sfx, Streaks} from '../overlay/Overlays';
import {toScreen} from '../three/Helpers';
import {HudBrackets, HudRect} from '../three/Hud';
import {APPROVED_3D, Massing3D, floorY, storey} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D} from '../three/Text3D';
import {Shot, shotTrack} from '../three/shot';

// ── Scene 03 · Camera vs. design ──────────────────────────────────────
// Straight down onto the roof, the building rises. The camera then swings
// hard through three viewpoints; the marked window, balcony and entrance
// stay exactly where they are on the building. Ends in a whip pan.

const P = APPROVED_3D;
const C: [number, number, number] = [0, 0, -1.5];
const FH = storey(P);
const plateY = (i: number) => floorY(P, i) - FH / 2 + P.gap / 2;
const coreY = (i: number) => floorY(P, i) - FH / 2 + P.gap + P.h / 2;
const LINE2_AT = 50;
const OUT = 104;
const WHIP = 108;
const END = 128;
const L1 = {y: 300, size: 100};
const L2 = {y: 450, size: 132};

// marked elements (building-local coordinates)
const bw = P.w / 4;
const WIN = {x: -P.w / 2 + bw * 3.5, y: coreY(3), w: bw * 0.62 + 0.12, h: P.h * 0.7 + 0.12};
const BAL = {x: -P.w * 0.31, y: plateY(2) + 0.14, w: P.w * 0.3 + 0.12, h: 0.42, z: 0.42};
const ENT = {x: 0, y: coreY(0) - 0.02, w: P.w * 0.52 + 0.12, h: P.h * 0.92};

const rect = (x: number, y: number, z: number, w: number, h: number): [number, number, number][] => [
  [C[0] + x - w / 2, y - h / 2, C[2] + z],
  [C[0] + x + w / 2, y - h / 2, C[2] + z],
  [C[0] + x + w / 2, y + h / 2, C[2] + z],
  [C[0] + x - w / 2, y + h / 2, C[2] + z],
  [C[0] + x - w / 2, y - h / 2, C[2] + z],
];

const BASE: Shot = {tx: 0, ty: 0, tz: -1.5, dist: 19, yaw: 0, pitch: 89.5, roll: 0, fov: 30};

export const S3Camera: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotTrack(f, BASE, [
    [0, {}],
    [6, {}],
    [32, {tx: 0, ty: 1.9, tz: -1.5, dist: 20, yaw: -50, pitch: 16, roll: -7}, EASE.inOut],
    [48, {yaw: -58, dist: 19.5}, EASE.smooth],
    [72, {yaw: 46, pitch: 9, roll: 6, dist: 19}, EASE.inOut],
    [86, {yaw: 54}, EASE.smooth],
    [WHIP, {yaw: 8, pitch: 26, roll: 0, dist: 20.5}, EASE.inOut],
    [END, {yaw: 200, roll: 28, dist: 16, pitch: 18}, EASE.in],
  ]);

  const rise = (i: number) => prog(f, 1 + i * 2.5, 10, EASE.overshoot);
  const whip = prog(f, WHIP, END - WHIP, EASE.in);
  const hide = 1 - prog(f, OUT, 10, EASE.in);
  // the building rides through the whip and only vanishes on the cut
  const objHide = 1 - prog(f, END - 5, 5, EASE.in);
  const mark = (a: number) => prog(f, a, 10, EASE.out) * hide;

  const fz = P.d / 2 + 0.05;
  const pin = (x: number, y: number, z: number) => {
    const [sx, sy] = toScreen(shot, [C[0] + x, y, C[2] + z]);
    return [sx, sy] as [number, number];
  };
  const wPin = pin(WIN.x, WIN.y + WIN.h / 2, fz);
  const bPin = pin(BAL.x, BAL.y + BAL.h / 2, fz + BAL.z);
  const ePin = pin(ENT.x, ENT.y - ENT.h / 2, fz + 0.3);

  const angle = Math.round(((shot.yaw + 540) % 360) - 180);

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[C[0], 1.5, C[2]]}
        grid={lerp(0.12, 0.04, prog(f, 8, 24))}
        hud={
          <>
            <Line3D text={COPY.s3.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={4} stagger={4} mode="spin" outAt={OUT} outMode="flipOut" />
            <Line3D
              text={COPY.s3.line2}
              x={TEXT_RIGHT}
              y={L2.y}
              size={L2.size}
              inAt={LINE2_AT}
              inDur={14}
              stagger={3}
              mode="slam"
              hl={{at: LINE2_AT + 10, dur: 10, outAt: OUT + 2, outDur: 8}}
              outAt={OUT + 2}
              outMode="flipOut"
            />
            {(
              [
                [COPY.s3.labels[0], wPin, 22, -1],
                [COPY.s3.labels[1], bPin, 28, -1],
                [COPY.s3.labels[2], ePin, 34, 1],
              ] as [string, [number, number], number, number][]
            ).map(([t, pp, a, dir], i) => {
              const v = prog(f, a, 10) * hide;
              if (v <= 0) return null;
              const len = 70 * v;
              return (
                <group key={i}>
                  <HudRect x={pp[0] - 2.5} y={dir < 0 ? pp[1] - len : pp[1]} w={5} h={len} />
                  <Line3D
                    text={t}
                    x={pp[0]}
                    y={dir < 0 ? pp[1] - 108 : pp[1] + 108}
                    align="center"
                    size={46}
                    weight={700}
                    depth={10}
                    inAt={a + 2}
                    inDur={10}
                    mode="flip"
                    hl={{at: a + 4, dur: 8, depth: 8, outAt: OUT - 4, outDur: 8}}
                    outAt={OUT - 4}
                    outMode="flipOut"
                  />
                </group>
              );
            })}
            <HudBrackets x={110} y={600} w={860} h={900} opacity={prog(f, 10, 10) * hide} />
            {f > 12 && f < OUT ? (
              <Line3D text={`${angle > 0 ? '+' : ''}${angle}°`} x={540} y={1600} align="center" size={44} weight={700} depth={8} inAt={0} mode="none" dir="ltr" />
            ) : null}
          </>
        }
      >
        <Massing3D params={P} position={C} floorFx={(i) => ({show: rise(i) * objHide})} roof />

        {/* the marked elements: outlines fixed to the building */}
        {mark(22) > 0 ? (
          <Line points={rect(WIN.x, WIN.y, fz + 0.03, WIN.w, WIN.h)} color={COLORS.ink} lineWidth={5} transparent opacity={mark(22)} />
        ) : null}
        {mark(28) > 0 ? (
          <Line points={rect(BAL.x, BAL.y, fz + BAL.z + 0.05, BAL.w, BAL.h)} color={COLORS.ink} lineWidth={5} transparent opacity={mark(28)} />
        ) : null}
        {mark(34) > 0 ? (
          <Line points={rect(ENT.x, ENT.y, fz + 0.62, ENT.w, ENT.h)} color={COLORS.ink} lineWidth={5} transparent opacity={mark(34)} />
        ) : null}
      </Stage>

      <Streaks p={whip} angle={-8 + whip * 20} count={26} opacity={clamp01(whip * 3)} />
      <Sfx at={LINE2_AT + 10} name="slam" volume={0.6} />
    </AbsoluteFill>
  );
};
