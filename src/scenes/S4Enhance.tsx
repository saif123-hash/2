import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT} from '../config/theme';
import {EASE, clamp01, lerp, prog, shake} from '../lib/motion';
import {Sfx, Streaks} from '../overlay/Overlays';
import {Beam, Check3D, EnvelopeBox, toScreen} from '../three/Helpers';
import {HudRect} from '../three/Hud';
import {APPROVED_3D, Massing3D, Slab, floorY, height3D} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D} from '../three/Text3D';
import {Shot, shotTrack, solveShot} from '../three/shot';

// ── Scene 04 · Enhancement vs. invention ──────────────────────────────
// Out of the whip, the approved composition gets richer: cladding fins,
// glowing trims and a sweeping key light, then site elements. An invented
// cantilever shoots out; the approved envelope exposes it; a giant navy
// panel sweeps through the camera and knocks it off.

const P = APPROVED_3D;
const H = height3D(P);
const MAT = 22;
const FIN = 38;
const SITE = 54;
const INVENT = 72;
const EXPOSE = 84;
const SWEEP = {from: 96, to: 112};
const RESTORE = 114;
const OUT = 124;
const END = 144;
const L1 = {y: 1250, size: 104};
const L2 = {y: 1400, size: 132};
const CANT = {floor: 2, len: 3.4};

const BASE: Shot = {tx: 0.6, ty: 1.2, tz: 0, dist: 13, yaw: -150, pitch: 20, roll: 26, fov: 30};

export const S4Enhance: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotTrack(f, BASE, [
    [0, {}],
    [18, {tx: 0.4, ty: 0.3, tz: 0, dist: 20.5, yaw: -22, pitch: 9, roll: 0}, EASE.out],
    [INVENT, {yaw: 16, dist: 20}, EASE.smooth],
    [EXPOSE + 6, {tx: 1.6, ty: 0.5, dist: 17.5, yaw: 24, pitch: 10}, EASE.inOut],
    [RESTORE + 6, {tx: 0.6, ty: 0.3, dist: 20, yaw: 30, pitch: 9}, EASE.inOut],
    [END, {tx: 0, ty: 0.2, tz: 2, dist: 9, yaw: 90, pitch: 4, roll: 0}, EASE.inOut],
  ]);
  shot.tx += shake(f, INVENT + 8, 0.08, 10);
  shot.roll += shake(f + 2, SWEEP.from + 8, 2, 12);

  const build = (i: number) => prog(f, 2 + i * 2, 8, EASE.out);
  const sink = prog(f, OUT, 16, EASE.in);
  const fins = prog(f, MAT, 14, EASE.inOut) * (1 - sink);
  const trim = prog(f, FIN, 14, EASE.inOut) * (1 - sink);
  const site = (k: number) => prog(f, SITE + k * 2, 12, EASE.overshoot) * (1 - sink);
  const keyAngle = lerp(0, 70, prog(f, FIN, 40, EASE.inOut));

  const cantP = prog(f, INVENT, 12, EASE.overshoot);
  const expose = prog(f, EXPOSE, 12, EASE.out);
  const sw = prog(f, SWEEP.from, SWEEP.to - SWEEP.from, EASE.inOut);
  const knocked = f >= SWEEP.from + 8;
  const fallT = Math.max(0, (f - (SWEEP.from + 8)) / 30);
  const restore = prog(f, RESTORE, 10);

  // the navy panel travels across, just in front of the camera
  const cam = solveShot(shot);
  const tgt = new THREE.Vector3(shot.tx, shot.ty, shot.tz);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  const panelPos = cam.position.clone().lerp(tgt, 0.3).addScaledVector(right, lerp(14, -14, sw));

  const floorFx = (i: number) => ({
    show: build(i) * (1 - prog(f, OUT + (4 - i) * 1.5, 10, EASE.in)),
  });

  // label pins
  const pin = (p: [number, number, number]) => toScreen(shot, p);
  const pMat = pin([-0.4, floorY(P, 3), P.d / 2]);
  const pFin = pin([P.w / 2, floorY(P, 4) + P.h / 2, P.d / 2]);
  const pSite = pin([2.7, 1.3, -1.4]);
  const labOut = 1 - prog(f, EXPOSE - 4, 8, EASE.in);
  const labels: [string, [number, number, number], number][] = [
    [COPY.s4.labels[0], pMat, MAT],
    [COPY.s4.labels[1], pFin, FIN],
    [COPY.s4.labels[2], pSite, SITE],
  ];

  const trees: [number, number, number][] = [
    [-2.6, 0, 1.2],
    [-3.2, 0, -0.6],
    [2.7, 0, -1.4],
    [3.3, 0, 0.8],
    [-2.2, 0, -2.2],
  ];

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[0, 1, 0]}
        keyAngle={keyAngle}
        hud={
          <>
            <Line3D text={COPY.s4.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={14} stagger={4} mode="rise" outAt={OUT - 2} outMode="fall" />
            <Line3D
              text={COPY.s4.line2}
              x={TEXT_RIGHT}
              y={L2.y}
              size={L2.size}
              inAt={EXPOSE - 4}
              inDur={14}
              stagger={4}
              mode="drop"
              ease={EASE.overshoot}
              hl={{at: EXPOSE + 6, dur: 10, outAt: OUT, outDur: 8}}
              outAt={OUT}
              outMode="fall"
            />
            {labels.map(([t, p, a], i) => {
              const v = prog(f, a, 10) * labOut;
              if (v <= 0) return null;
              return (
                <group key={i}>
                  <HudRect x={p[0] - 2.5} y={p[1] - 60 * v} w={5} h={60 * v} />
                  <Line3D text={t} x={p[0]} y={p[1] - 96} align="center" size={46} weight={700} depth={10} inAt={a + 2} inDur={10} mode="flip" hl={{at: a + 4, dur: 8, depth: 8, outAt: EXPOSE - 4, outDur: 8}} outAt={EXPOSE - 4} outMode="flipOut" />
                </group>
              );
            })}
          </>
        }
      >
        <Massing3D params={P} floorFx={floorFx} />

        {/* materials: cladding fins */}
        {fins > 0.01
          ? Array.from({length: 5}, (_, i) =>
              Array.from({length: 13}, (_, k) => {
                const x = -P.w / 2 + 0.12 + k * ((P.w - 0.24) / 12);
                const local = clamp01(fins * 1.6 - k / 13);
                return local > 0.01 ? (
                  <mesh key={`${i}-${k}`} position={[x, floorY(P, i), P.d / 2 + 0.05]} scale={[1, local, 1]}>
                    <boxGeometry args={[0.035, P.h * 0.86, 0.06]} />
                    <meshStandardMaterial color="#2C4A6B" roughness={0.3} metalness={0.3} />
                  </mesh>
                ) : null;
              }),
            )
          : null}
        {/* finishes: glowing trims along every slab edge */}
        {trim > 0.01
          ? Array.from({length: 5}, (_, i) => (
              <group key={i} position={[0, floorY(P, i) + P.h / 2 + 0.012, 0]}>
                <mesh position={[0, 0, P.d / 2 + 0.01]} scale={[trim, 1, 1]}>
                  <boxGeometry args={[P.w + 0.02, 0.04, 0.05]} />
                  <meshBasicMaterial color={COLORS.highlight} />
                </mesh>
                <mesh position={[P.w / 2 + 0.01, 0, 0]} scale={[1, 1, trim]}>
                  <boxGeometry args={[0.05, 0.04, P.d + 0.02]} />
                  <meshBasicMaterial color={COLORS.highlight} />
                </mesh>
              </group>
            ))
          : null}
        {/* site elements */}
        {trees.map((t, k) => {
          const s = site(k);
          return s > 0.01 ? (
            <group key={k} position={t} scale={s}>
              <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.06, 0.7, 10]} />
                <meshStandardMaterial color={COLORS.ink} />
              </mesh>
              <mesh position={[0, 0.95, 0]} castShadow>
                <sphereGeometry args={[0.42 + (k % 2) * 0.12, 24, 18]} />
                <meshStandardMaterial color={COLORS.highlight} roughness={0.5} emissive={COLORS.highlight} emissiveIntensity={0.2} />
              </mesh>
            </group>
          ) : null;
        })}
        {site(5) > 0.01 ? (
          <group scale={[site(5), 1, site(5)]}>
            {Array.from({length: 7}, (_, k) => (
              <mesh key={k} position={[-2.1 + k * 0.7, 0.015, P.d / 2 + 0.9]} receiveShadow>
                <boxGeometry args={[0.5, 0.03, 0.5]} />
                <meshStandardMaterial color="#C9D6EE" />
              </mesh>
            ))}
          </group>
        ) : null}

        {/* the invented cantilever */}
        {cantP > 0 && fallT < 1.2 ? (
          <group
            position={[P.w / 2 + (CANT.len * cantP) / 2 - 0.1 + fallT * 1.5, floorY(P, CANT.floor) - 4.9 * fallT * fallT * (knocked ? 1 : 0), 0]}
            rotation={[0, 0, knocked ? -fallT * 2.4 : 0]}
          >
            <group scale={[cantP, 1, 1]}>
              <Slab w={CANT.len} h={P.h * 0.8} d={P.d * 0.8} look="hatch" />
            </group>
            {/* cross */}
            {expose > 0 ? (
              <group position={[0, 0, P.d * 0.4 + 0.15]} scale={expose}>
                <mesh rotation={[0, 0, Math.PI / 4]}>
                  <boxGeometry args={[0.16, 1.5, 0.1]} />
                  <meshStandardMaterial color={COLORS.ink} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 4]}>
                  <boxGeometry args={[0.16, 1.5, 0.1]} />
                  <meshStandardMaterial color={COLORS.ink} />
                </mesh>
              </group>
            ) : null}
          </group>
        ) : null}
        <EnvelopeBox w={P.w + 0.2} h={H + 0.15} d={P.d + 0.2} opacity={expose * (1 - restore) * (1 - sink)} dashed />
        <Check3D p={restore * (1 - sink)} position={[P.w / 2 + 0.2, H + 0.6, P.d / 2]} size={0.45} yaw={25} />

        {/* navy accent panel sweeping through the shot */}
        {sw > 0 && sw < 1 ? (
          <mesh position={panelPos} quaternion={cam.quaternion}>
            <boxGeometry args={[9, 22, 0.2]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>
        ) : null}

        {/* the ground line that becomes Scene 05's review rail */}
        <Beam length={lerp(0, 60, prog(f, OUT + 2, 16, EASE.inOut))} position={[0, 0, 2]} width={0.3} rotationY={0} core={1} />
      </Stage>

      <Streaks p={prog(f, -6, 22, EASE.out)} angle={18} count={20} opacity={0.8} />

      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={2 + i * 2} name="tick" volume={0.45} rate={1.2 + i * 0.05} />
      ))}
      <Sfx at={MAT} name="sweep" volume={0.5} />
      <Sfx at={FIN} name="click" />
      <Sfx at={SITE} name="pop" volume={0.6} />
      <Sfx at={SITE + 4} name="pop" volume={0.5} rate={1.2} />
      <Sfx at={INVENT} name="slam" volume={0.6} />
      <Sfx at={EXPOSE} name="error" volume={0.6} />
      <Sfx at={EXPOSE + 6} name="sweep" volume={0.6} />
      <Sfx at={SWEEP.from + 2} name="whoosh" volume={0.8} />
      <Sfx at={SWEEP.from + 9} name="impact" volume={0.5} />
      <Sfx at={RESTORE} name="resolve" volume={0.55} />
      <Sfx at={OUT + 2} name="swoosh" volume={0.5} />
    </AbsoluteFill>
  );
};
