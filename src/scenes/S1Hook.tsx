import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COPY} from '../config/copy';
import {TEXT_RIGHT} from '../config/theme';
import {EASE, prog, shake, tween} from '../lib/motion';
import {Panel, Sfx} from '../overlay/Overlays';
import {Burst} from '../three/Burst';
import {Digit3D} from '../three/Digit3D';
import {Floor3D, Massing3D, Params3D, floorY} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D, lineLayout} from '../three/Text3D';
import {Shot, shotTrack} from '../three/shot';

// ── Scene 01 · The hook ────────────────────────────────────────────────
// Macro on an extruded 5 → five slabs crash down on the beat → a sixth,
// uninvited slab slams on top (debris, camera jolt) → the digit flips to
// reveal 6 → the highlight behind the question floods the frame.

const STACK: Params3D = {floors: 5, w: 2.6, h: 0.56, d: 2.0, gap: 0.1, pattern: 0};
const STACK_POS: [number, number, number] = [0.95, 0, -0.9];
const DIGIT_POS: [number, number, number] = [-1.45, 0, 1.2];
const LAND = [20, 26, 32, 38, 44];
const SIX = {from: 62, land: 72};
const FLIP = {at: 76, dur: 16};
const L1 = {y: 1250, size: 112};
const L2 = {y: 1400, size: 128};
const SUP = {y: 1548, size: 44, at: 104};
const OUT = 136;
const WIPE = 146;
const END = 160;

const BASE: Shot = {tx: -1.2, ty: 1.6, tz: 1.0, dist: 4.3, yaw: -32, pitch: 2, roll: -9, fov: 34};

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();

  const shot = shotTrack(f, BASE, [
    [0, {}],
    [36, {tx: -0.1, ty: 0.15, tz: 0, dist: 22, yaw: 44, pitch: 9, roll: 0, fov: 30}, EASE.inOut],
    [64, {yaw: 52, dist: 21.5}, EASE.smooth],
    [72, {dist: 21}, EASE.in],
    [100, {tx: -0.55, ty: 0.35, tz: 0.3, dist: 21.5, yaw: 34, pitch: 5, roll: 2.5, fov: 31}, EASE.out],
    [136, {yaw: 26, dist: 21, roll: 0}, EASE.smooth],
    [END, {dist: 16, pitch: 2}, EASE.in],
  ]);
  // impact jolt
  shot.tx += shake(f, SIX.land, 0.16, 14);
  shot.ty += shake(f + 3, SIX.land, 0.2, 14);
  shot.roll += shake(f + 1, SIX.land, 2.2, 14);
  LAND.forEach((l) => {
    shot.ty += shake(f, l, 0.04, 6);
  });

  // digit: swings in, then flips to show the 6 on its back
  const swing = tween(f, 0, 16, -75, 0, EASE.overshoot);
  const flip = prog(f, FLIP.at, FLIP.dur, EASE.inOut);
  const lift = Math.sin(flip * Math.PI) * 0.7;
  const grow = tween(f, FLIP.at + 12, FLIP.at + 26, 1, 1.18, EASE.overshoot);
  const dExit = prog(f, OUT + 4, 16, EASE.in);

  // floors: fall with acceleration, squash on landing
  const squashAll = f >= SIX.land ? Math.sin((f - SIX.land) * 0.85) * 0.12 * Math.exp(-(f - SIX.land) * 0.2) : 0;
  const floorFx = (i: number) => {
    const land = LAND[i];
    const fall = prog(f, land - 9, 9, EASE.in);
    const t = f - land;
    const sq = t >= 0 ? Math.sin(t * 1.1) * 0.22 * Math.exp(-t * 0.35) : 0;
    const out = prog(f, OUT + (4 - i) * 2, 12, EASE.in);
    return {
      dy: (1 - fall) * 7,
      sy: 1 - sq - squashAll,
      sx: 1 + sq * 0.4,
      sz: 1 + sq * 0.4,
      show: fall > 0 ? 1 - out : 0,
    };
  };
  const sixFall = prog(f, SIX.from, SIX.land - SIX.from, EASE.in);
  const sixY = floorY(STACK, 5) + (1 - sixFall) * 11;
  const sixOut = prog(f, OUT, 12, EASE.in);

  // highlight → full-frame wipe (screen space)
  const l2 = lineLayout(COPY.s1.line2, L2.size, 900, 912);
  const padX = l2.size * 0.24;
  const r0 = {left: TEXT_RIGHT - l2.width - padX, top: L2.y + l2.size * 0.04 - (l2.size * 1.18) / 2, width: l2.width + padX * 2, height: l2.size * 1.18};
  const w = prog(f, WIPE, END - WIPE, EASE.in);

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[0, 1, 0]}
        hud={
          <>
            <Line3D text={COPY.s1.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={22} stagger={4} mode="flip" outAt={OUT} outMode="flipOut" />
            <Line3D
              text={COPY.s1.line2}
              x={TEXT_RIGHT}
              y={L2.y}
              size={L2.size}
              inAt={78}
              inDur={14}
              stagger={3}
              mode="slam"
              outAt={OUT + 4}
              outMode="flipOut"
              outStagger={1}
              hl={{at: 88, dur: 12}}
            />
            {COPY.s1.support.map((t, i) => (
              <Line3D key={i} text={t} x={TEXT_RIGHT} y={SUP.y + i * 58} size={SUP.size} weight={500} depth={6} inAt={SUP.at + i * 5} stagger={2} mode="rise" outAt={OUT - 6} outMode="flipOut" />
            ))}
          </>
        }
      >
        {/* the digit pair: 5 on the front, 6 on the back */}
        <group position={[DIGIT_POS[0], DIGIT_POS[1] + lift, DIGIT_POS[2]]} rotation={[0, THREE.MathUtils.degToRad(swing + flip * 180), 0]} scale={grow * (1 - dExit)}>
          <group position={[0, 0, 0.42]}>
            <Digit3D char="5" height={3.0} depth={0.7} />
          </group>
          <group position={[0, 0, -0.42]} rotation={[0, Math.PI, 0]}>
            <Digit3D char="6" height={3.0} depth={0.7} />
          </group>
        </group>

        <Massing3D params={STACK} position={STACK_POS} floorFx={floorFx} roof={false} />

        {/* the uninvited sixth slab */}
        {sixFall > 0 && sixOut < 1 ? (
          <group position={[STACK_POS[0], sixY, STACK_POS[2]]} scale={[1 - sixOut, (1 - squashAll * 1.4) * (1 - sixOut), 1 - sixOut]}>
            <Floor3D p={STACK} index={5} look="hatch" />
          </group>
        ) : null}
        <Burst t={(f - SIX.land) / 30} origin={[STACK_POS[0], floorY(STACK, 5), STACK_POS[2]]} count={30} power={1.1} />
      </Stage>

      {f >= WIPE ? (
        <Panel
          left={r0.left * (1 - w) - 40 * w}
          top={r0.top * (1 - w) - 40 * w}
          width={r0.width * (1 - w) + 1160 * w}
          height={r0.height * (1 - w) + 2000 * w}
          radius={8 * (1 - w)}
        />
      ) : null}

      {LAND.map((l, i) => (
        <Sfx key={i} at={l} name="thud" rate={1 + i * 0.06} volume={0.8} />
      ))}
      <Sfx at={SIX.land} name="impact" volume={0.6} />
      <Sfx at={WIPE} name="slam" volume={0.6} />
    </AbsoluteFill>
  );
};
