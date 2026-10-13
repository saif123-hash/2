import React from 'react';
import {Line} from '@react-three/drei';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT} from '../config/theme';
import {EASE, clamp01, prog} from '../lib/motion';
import {Sfx, Streaks} from '../overlay/Overlays';
import {toScreen} from '../three/Helpers';
import {HudBrackets, HudRect} from '../three/Hud';
import {Stage} from '../three/Stage';
import {Line3D} from '../three/Text3D';
import {Shot, shotTrack} from '../three/shot';

// ── Scene 03 · Camera vs. design ──────────────────────────────────────
// Top-down on the grid, the anchored elements pop up. The camera then
// swings hard through three viewpoints; every element, and every relation
// between them, stays exactly where it is. Ends in a whip pan.

const C: [number, number, number] = [0, 0, -1.5];
const at = (x: number, y: number, z: number): [number, number, number] => [C[0] + x, C[1] + y, C[2] + z];
const WINDOWS = [at(-1.7, 0.36, -1.7), at(-0.7, 0.36, -1.7), at(-1.7, 0.36, -0.7), at(-0.7, 0.36, -0.7)];
const BALCONIES = [at(1.5, 0.16, -1.8), at(1.5, 0.16, -0.5)];
const ENTRANCE = at(0, 0.95, 1.8);
const LINE2_AT = 50;
const OUT = 104;
const WHIP = 108;
const END = 128;
const L1 = {y: 300, size: 100};
const L2 = {y: 450, size: 132};

const BASE: Shot = {tx: 0, ty: 0, tz: -1.5, dist: 19, yaw: 0, pitch: 89.5, roll: 0, fov: 30};

export const S3Camera: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotTrack(f, BASE, [
    [0, {}],
    [8, {}],
    [32, {tx: 0.15, ty: 1.9, tz: -2.0, dist: 14.8, yaw: -56, pitch: 21, roll: -7}, EASE.inOut],
    [48, {yaw: -62, dist: 13.5}, EASE.smooth],
    [72, {yaw: 52, pitch: 16, roll: 6, dist: 13.5}, EASE.inOut],
    [86, {yaw: 58}, EASE.smooth],
    [WHIP, {yaw: 12, pitch: 32, roll: 0, dist: 15}, EASE.inOut],
    [END, {yaw: 200, roll: 28, dist: 12, pitch: 20}, EASE.in],
  ]);

  const pop = (d: number) => prog(f, 1 + d, 12, EASE.overshoot);
  const whip = prog(f, WHIP, END - WHIP, EASE.in);
  const hide = 1 - prog(f, OUT, 10, EASE.in);
  // the objects ride through the whip and only vanish on the cut
  const objHide = 1 - prog(f, END - 5, 5, EASE.in);
  const relP = prog(f, 20, 14, EASE.inOut);

  // pins for the HUD labels follow the 3D elements through every move
  const pin = (p: [number, number, number], dy: number) => {
    const [x, y] = toScreen(shot, [p[0], p[1] + dy, p[2]]);
    return [x, y] as [number, number];
  };
  const wPin = pin(at(-1.2, 0.72, -1.2), 0.3);
  const bPin = pin(BALCONIES[0], 0.4);
  const ePin = pin(ENTRANCE, 0.85);
  const lab = (a: number) => prog(f, a, 10) * hide;

  const angle = Math.round(((shot.yaw + 540) % 360) - 180);

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={C}
        grid={0.22}
        hud={
          <>
            <Line3D text={COPY.s3.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={4} stagger={4} mode="spin" outAt={OUT} outMode="flyOut" />
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
              outMode="flyOut"
            />
            {[
              [COPY.s3.labels[0], wPin, 22],
              [COPY.s3.labels[1], bPin, 28],
              [COPY.s3.labels[2], ePin, 34],
            ].map(([t, p, a], i) => {
              const pp = p as [number, number];
              const v = lab(a as number);
              if (v <= 0) return null;
              return (
                <group key={i}>
                  <HudRect x={pp[0] - 2.5} y={pp[1] - 56 * v} w={5} h={56 * v} />
                  <Line3D text={t as string} x={pp[0]} y={pp[1] - 92} align="center" size={46} weight={700} depth={10} inAt={(a as number) + 2} inDur={10} mode="flip" hl={{at: (a as number) + 4, dur: 8, depth: 8, outAt: OUT - 4, outDur: 8}} outAt={OUT - 4} outMode="flipOut" />
                </group>
              );
            })}
            <HudBrackets x={110} y={600} w={860} h={900} opacity={prog(f, 10, 10) * hide} />
            {f > 12 && f < OUT ? (
              <Line3D text={`${angle > 0 ? '+' : ''}${angle}°`} x={540} y={1560} align="center" size={44} weight={700} depth={8} inAt={0} mode="none" dir="ltr" />
            ) : null}
          </>
        }
      >
        {/* relations on the floor: fixed in the world */}
        {relP > 0 ? (
          <group position={[0, 0.02, 0]}>
            <Line points={[at(-1.2, 0, -1.2), at(1.5, 0, -1.15)]} color={COLORS.ink} lineWidth={3} dashed dashSize={0.25} gapSize={0.18} transparent opacity={relP * hide} />
            <Line points={[at(-1.2, 0, -1.2), at(0, 0, 1.8)]} color={COLORS.ink} lineWidth={3} dashed dashSize={0.25} gapSize={0.18} transparent opacity={relP * hide} />
            <Line points={[at(1.5, 0, -1.15), at(0, 0, 1.8)]} color={COLORS.ink} lineWidth={3} dashed dashSize={0.25} gapSize={0.18} transparent opacity={relP * hide} />
          </group>
        ) : null}

        {WINDOWS.map((p, i) => {
          const s = pop(i * 2) * objHide;
          return s > 0.001 ? (
            <mesh key={i} position={[p[0], p[1] * s, p[2]]} scale={s} castShadow>
              <boxGeometry args={[0.72, 0.72, 0.72]} />
              <meshStandardMaterial color={COLORS.highlight} emissive={COLORS.highlight} emissiveIntensity={0.35} roughness={0.35} />
            </mesh>
          ) : null;
        })}
        {BALCONIES.map((p, i) => {
          const s = pop(8 + i * 2) * objHide;
          return s > 0.001 ? (
            <mesh key={i} position={p} scale={[s, s, s]} castShadow>
              <boxGeometry args={[2.4, 0.32, 0.62]} />
              <meshStandardMaterial color={COLORS.ink} roughness={0.4} />
            </mesh>
          ) : null;
        })}
        {pop(14) * objHide > 0.001 ? (
          <group position={ENTRANCE} scale={pop(14) * objHide}>
            <mesh rotation={[0, THREE.MathUtils.degToRad(f * 3), 0]} castShadow>
              <octahedronGeometry args={[0.6, 0]} />
              <meshStandardMaterial color={COLORS.ink} roughness={0.3} flatShading />
            </mesh>
            <mesh position={[0, -0.93, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.95, 0.07, 12, 64]} />
              <meshStandardMaterial color={COLORS.highlight} emissive={COLORS.highlight} emissiveIntensity={0.4} />
            </mesh>
          </group>
        ) : null}
      </Stage>

      <Streaks p={whip} angle={-8 + whip * 20} count={26} opacity={clamp01(whip * 3)} />

      <Sfx at={6} name="pop" volume={0.6} />
      <Sfx at={14} name="pop" rate={1.2} volume={0.5} />
      <Sfx at={20} name="pop" rate={1.4} volume={0.5} />
      <Sfx at={10} name="swoosh" volume={0.5} />
      <Sfx at={48} name="swoosh" volume={0.45} rate={1.1} />
      <Sfx at={LINE2_AT + 10} name="slam" volume={0.6} />
      <Sfx at={86} name="swoosh" volume={0.4} rate={0.9} />
      <Sfx at={WHIP} name="whoosh" volume={0.7} />
    </AbsoluteFill>
  );
};
