import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT} from '../config/theme';
import {EASE, Key, clamp01, lerp, prog, track} from '../lib/motion';
import {Panel, Sfx} from '../overlay/Overlays';
import {Beam, Check3D, EnvelopeBox} from '../three/Helpers';
import {APPROVED_3D, Massing3D, height3D} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D} from '../three/Text3D';
import {Shot, shotTrack} from '../three/shot';

// ── Scene 05 · Review the entire video ────────────────────────────────
// The ground line is now a review rail. One state, then the camera pulls
// back over the whole sequence. A glowing review gate travels the rail,
// stops on the in-between state where the openings drop out, fixes it,
// moves on, then turns flat and flies into the lens.

const Z = 2;
const N = 7;
const SCALE = 0.34;
const X = (i: number) => -2 - i * 3.4;
const ERR = 4;
const GATE = {start: 46, err: 70, resume: 98, done: 118};
const OUT = 122;
const FLY = 126;
const END = 144;
const L1 = {y: 300, size: 104};
const L2 = {y: 450, size: 128};
const SUP = {y: 1520, size: 46};

const BASE: Shot = {tx: 0, ty: 0.2, tz: 2, dist: 9, yaw: 90, pitch: 4, roll: 0, fov: 30};

export const S5Review: React.FC = () => {
  const f = useCurrentFrame();

  const gx = track(f, [
    [GATE.start, X(0) + 1.6],
    [GATE.err, X(ERR) + 1.0, EASE.smooth],
    [GATE.resume, X(ERR) + 1.0],
    [GATE.done, X(N - 1) - 1.2, EASE.smooth],
  ] as Key[]);
  const follow = prog(f, 40, 14, EASE.inOut);

  const overview = shotTrack(f, BASE, [
    [0, {}],
    [10, {tx: X(0), ty: 0.55, dist: 5.5, yaw: 62, pitch: 9, roll: -3}, EASE.out],
    [36, {tx: X(3), ty: 0.3, dist: 30, yaw: 64, pitch: 20, roll: 0}, EASE.inOut],
  ]);
  const chase = shotTrack(f, {...BASE, tx: X(0), ty: 0.55, dist: 15, yaw: 46, pitch: 13, roll: 0}, [
    [GATE.err - 4, {}],
    [GATE.err + 8, {dist: 10.5, yaw: 36, pitch: 10, roll: -2}, EASE.out],
    [GATE.resume - 2, {dist: 10.5, yaw: 30}],
    [GATE.resume + 10, {dist: 15, yaw: 48, pitch: 13, roll: 0}, EASE.inOut],
    [FLY, {dist: 12, yaw: 66, pitch: 8}],
  ]);
  chase.tx = gx - 1.4;
  const shot: Shot = {...overview};
  (Object.keys(shot) as (keyof Shot)[]).forEach((k) => {
    shot[k] = lerp(overview[k], chase[k], follow);
  });

  const appear = (i: number) => (i === 0 ? prog(f, 0, 10, EASE.overshoot) : prog(f, 12 + i * 3, 10, EASE.overshoot));
  const errReveal = prog(f, GATE.err + 2, 10, EASE.out);
  const fix = prog(f, GATE.err + 16, 12, EASE.inOut);
  const passed = (i: number) => f >= 40 && gx <= X(i) + 0.1;
  const out = prog(f, OUT, 12, EASE.in);

  // the gate turns flat and flies into the lens
  const fly = prog(f, FLY, END - FLY, EASE.in);

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[X(3), 0.5, Z]}
        hud={
          <>
            <Line3D text={COPY.s5.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={8} stagger={4} mode="flip" outAt={OUT} outMode="flyOut" />
            <Line3D
              text={COPY.s5.line2}
              x={TEXT_RIGHT}
              y={L2.y}
              size={L2.size}
              inAt={GATE.err}
              inDur={14}
              stagger={3}
              mode="slam"
              hl={{at: GATE.err + 10, dur: 10, outAt: OUT + 2, outDur: 8}}
              outAt={OUT + 2}
              outMode="flyOut"
            />
            {COPY.s5.support.map((t, i) => (
              <Line3D key={i} text={t} x={TEXT_RIGHT} y={SUP.y + i * 62} size={SUP.size} weight={500} depth={6} inAt={38 + i * 6} stagger={2} mode="rise" outAt={OUT - 4} outMode="flipOut" />
            ))}
          </>
        }
      >
        {/* reviewed part of the rail glows */}
        <Beam length={80} position={[-20, 0, Z]} width={0.34} core={1 - out} />
        {follow > 0 ? (
          <mesh position={[(X(0) + 1.6 + gx) / 2, 0.06, Z]} scale={[Math.max(0.001, X(0) + 1.6 - gx), 1, 1]}>
            <boxGeometry args={[1, 0.03, 0.6]} />
            <meshBasicMaterial color={COLORS.highlight} />
          </mesh>
        ) : null}

        {Array.from({length: N}, (_, i) => {
          const isErr = i === ERR;
          const a = appear(i) * (1 - out);
          if (a <= 0.001) return null;
          const yaw = -40 + i * 13;
          return (
            <group key={i}>
              <Massing3D
                params={APPROVED_3D}
                position={[X(i), 0.04, Z]}
                rotationY={yaw}
                scale={SCALE * a}
                floorFx={(k) => ({
                  openings: isErr && k >= 2 ? (f < GATE.err - 30 ? 0 : fix) : 1,
                  widthMul: isErr && k === 4 ? lerp(0.68, 1, fix) : 1,
                })}
              />
              {i < N - 1 ? (
                <mesh position={[(X(i) + X(i + 1)) / 2, 0.15, Z]} rotation={[0, 0, 0]} scale={a}>
                  <torusGeometry args={[1.25, 0.035, 8, 40, Math.PI]} />
                  <meshStandardMaterial color={i === ERR - 1 && fix < 1 ? COLORS.ink : '#9DB4DE'} />
                </mesh>
              ) : null}
              <Check3D
                p={isErr ? prog(f, GATE.err + 26, 10) : (i === 0 || i === N - 1) && f > 34 && f < 44 ? prog(f, 34, 8) : passed(i) ? 1 : 0}
                position={[X(i), height3D(APPROVED_3D) * SCALE + 0.55, Z]}
                size={0.28}
                yaw={55}
              />
            </group>
          );
        })}

        {/* error reveal on the faulty in-between state */}
        {errReveal > 0 && fix < 1 ? (
          <group>
            <EnvelopeBox w={APPROVED_3D.w * SCALE + 0.3} h={height3D(APPROVED_3D) * SCALE + 0.2} d={APPROVED_3D.d * SCALE + 0.3} position={[X(ERR), 0, Z]} opacity={errReveal * (1 - fix)} dashed />
            <mesh position={[X(ERR), 0.05, Z]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + Math.sin(errReveal * Math.PI) * 0.5}>
              <torusGeometry args={[1.0, 0.04, 8, 48]} />
              <meshBasicMaterial color={COLORS.ink} transparent opacity={(1 - errReveal) * 0.9 + 0.1} />
            </mesh>
          </group>
        ) : null}

        {/* the review gate */}
        {follow > 0 ? (
          <group
            position={[gx + fly * 3, 0.95 + fly * 0.6, Z + fly * 3.5]}
            rotation={[0, THREE.MathUtils.degToRad(fly * 30), THREE.MathUtils.degToRad(fly * 90)]}
            scale={[1, clamp01(follow * 1.4) * (1 + fly * 2.5), 1 + fly * 2.5]}
          >
            <mesh>
              <boxGeometry args={[0.07, 1.9, 1.3]} />
              <meshStandardMaterial color={COLORS.highlight} emissive={COLORS.highlight} emissiveIntensity={0.6} transparent opacity={0.6} depthWrite={false} />
            </mesh>
            <mesh position={[0.045, 0, 0]}>
              <boxGeometry args={[0.02, 1.9, 0.08]} />
              <meshBasicMaterial color={COLORS.ink} />
            </mesh>
            <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshStandardMaterial color={COLORS.ink} />
            </mesh>
          </group>
        ) : null}
      </Stage>

      {fly > 0.6 ? <Panel left={-40} top={-40} width={1160} height={2000} radius={0} /> : null}
      {fly > 0.35 && fly <= 0.6 ? (
        <div style={{position: 'absolute', inset: 0, background: COLORS.highlight, opacity: (fly - 0.35) / 0.25}} />
      ) : null}

      <Sfx at={12} name="whoosh" volume={0.45} />
      <Sfx at={GATE.start} name="sweep" volume={0.5} />
      <Sfx at={GATE.err + 2} name="error" volume={0.8} />
      <Sfx at={GATE.err + 16} name="align" />
      <Sfx at={FLY} name="riser" volume={0.6} />
    </AbsoluteFill>
  );
};
