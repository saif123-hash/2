import React, {useMemo} from 'react';
import {Edges} from '@react-three/drei';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT} from '../config/theme';
import {EASE, lerp, prog, shake} from '../lib/motion';
import {Sfx, Streaks} from '../overlay/Overlays';
import {Beam, Check3D} from '../three/Helpers';
import {BuildingWire} from '../three/Wire';
import {APPROVED_3D, Massing3D, floorY, height3D, storey} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D, lineLayout} from '../three/Text3D';
import {Shot, shotTrack, solveShot} from '../three/shot';
import {hatchTexture} from '../three/textTexture';

// ── Scene 04 · Enhancement vs. invention ──────────────────────────────
// Out of the whip the building stands "raw". Materials turn crisp (white
// walls, lit glass, a light sweep), finishes add pale trims and the key
// light swings, site elements set it on a landscaped plinth. Then an
// oversized balcony is invented, exposed against the approved envelope,
// and a navy panel sweeps through the shot and knocks it off.

const P = APPROVED_3D;
const H = height3D(P);
const FH = storey(P);
const plateY = (i: number) => floorY(P, i) - FH / 2 + P.gap / 2;
const BEATS = [22, 40, 58]; // materials, finishes, site
const INVENT = 76;
const EXPOSE = 88;
const SWEEP = {from: 100, to: 114};
const RESTORE = 116;
const OUT = 124;
const END = 144;
const L1 = {y: 1262, size: 104};
const L2 = {y: 1412, size: 132};
const CHIP = {y: 252, size: 46, gap: 40};
const BIG = {floor: 3, w: 2.5, depth: 1.7};

const BASE: Shot = {tx: 0.3, ty: 1.4, tz: 0, dist: 14, yaw: -150, pitch: 20, roll: 26, fov: 30};

const RAW_WALL = new THREE.Color('#B7C0CC');
const FIN_WALL = new THREE.Color('#F0F3F8');
const RAW_GLASS = new THREE.Color('#8C9DB6');
const FIN_GLASS = new THREE.Color('#C6D8F8');

export const S4Enhance: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotTrack(f, BASE, [
    [0, {}],
    [18, {tx: 0.3, ty: 0.55, tz: 0.4, dist: 22, yaw: -32, pitch: 12, roll: 0}, EASE.out],
    [INVENT, {yaw: 2, dist: 21.5}, EASE.smooth],
    [EXPOSE + 6, {tx: 0.9, ty: 0.75, dist: 20, yaw: 22, pitch: 11}, EASE.inOut],
    [RESTORE + 6, {tx: 0.3, ty: 0.55, dist: 22, yaw: 28, pitch: 12}, EASE.inOut],
    [END, {tx: 0, ty: 0.2, tz: 2, dist: 9, yaw: 90, pitch: 4, roll: 0}, EASE.inOut],
  ]);
  shot.roll += shake(f + 2, SWEEP.from + 7, 1.6, 12);

  const build = (i: number) => prog(f, 2 + i * 2, 8, EASE.out);
  const sink = prog(f, OUT, 16, EASE.in);
  const mat = prog(f, BEATS[0], 14, EASE.inOut);
  const fin = prog(f, BEATS[1], 14, EASE.inOut) * (1 - sink);
  const site = (k: number) => prog(f, BEATS[2] + k * 1.5, 12, EASE.out) * (1 - sink);
  const keyAngle = lerp(-20, 55, prog(f, BEATS[1], 44, EASE.inOut));
  const sheen = prog(f, BEATS[0] + 2, 22, EASE.smooth);

  // materials: raw → crisp (scene-local material instances)
  const mats = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({color: RAW_WALL.clone(), roughness: 0.9}),
      glass: new THREE.MeshStandardMaterial({color: RAW_GLASS.clone(), roughness: 0.3, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0}),
    }),
    [],
  );
  mats.wall.color.lerpColors(RAW_WALL, FIN_WALL, mat);
  mats.wall.roughness = lerp(0.9, 0.6, mat);
  mats.glass.color.lerpColors(RAW_GLASS, FIN_GLASS, mat);
  mats.glass.emissiveIntensity = 0.45 * mat;
  mats.glass.roughness = lerp(0.3, 0.08, mat);

  const bigP = prog(f, INVENT, 12, EASE.overshoot);
  const expose = prog(f, EXPOSE, 12, EASE.out);
  const sw = prog(f, SWEEP.from, SWEEP.to - SWEEP.from, EASE.inOut);
  const knocked = f >= SWEEP.from + 7;
  const fallT = Math.max(0, (f - (SWEEP.from + 7)) / 30);
  const restore = prog(f, RESTORE, 10);

  // navy panel travelling just in front of the lens
  const cam = solveShot(shot);
  const tgt = new THREE.Vector3(shot.tx, shot.ty, shot.tz);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  const panelPos = cam.position.clone().lerp(tgt, 0.3).addScaledVector(right, lerp(14, -14, sw));

  const floorFx = (i: number) => ({show: build(i) * (1 - prog(f, OUT + (4 - i) * 1.5, 10, EASE.in))});

  // label chips: one row under the counter, each lights up on its beat
  const chips = COPY.s4.labels.map((t) => lineLayout(t, CHIP.size, 700));
  let acc = 0;
  const chipX = chips.map((c) => {
    const x = TEXT_RIGHT - acc;
    acc += c.width + CHIP.size * 0.5 + CHIP.gap;
    return x;
  });

  const hatchTop = useMemo(() => {
    const t = hatchTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(5, 3);
    return new THREE.MeshStandardMaterial({map: t, roughness: 0.6});
  }, []);

  const podium = site(0);
  const trees: [number, number][] = [
    [-2.3, 1.9],
    [2.4, 1.6],
    [-2.5, -1.5],
    [2.6, -1.6],
  ];

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[0, 1.5, 0]}
        keyAngle={keyAngle}
        keyIntensity={lerp(1.9, 2.5, fin)}
        grid={0.03}
        hud={
          <>
            {COPY.s4.labels.map((t, i) => (
              <Line3D
                key={i}
                text={t}
                x={chipX[i]}
                y={CHIP.y}
                size={CHIP.size}
                weight={700}
                depth={9}
                inAt={BEATS[i]}
                inDur={12}
                mode="flip"
                hl={{at: BEATS[i] + 4, dur: 8, depth: 8, outAt: i < 2 ? BEATS[i + 1] + 2 : INVENT, outDur: 8}}
                outAt={EXPOSE - 6}
                outMode="flipOut"
              />
            ))}
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
          </>
        }
      >
        <Massing3D params={P} floorFx={floorFx} mats={mats} />

        {/* materials: a light sweep travels across the front façade */}
        {sheen > 0 && sheen < 1 ? (
          <mesh position={[lerp(-P.w * 0.8, P.w * 0.8, sheen), H / 2, P.d / 2 + 0.08]} rotation={[0, 0, -0.35]}>
            <planeGeometry args={[0.5, H * 1.4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.55 * Math.sin(sheen * Math.PI)} depthWrite={false} />
          </mesh>
        ) : null}

        {/* finishes: pale trims on every floor-plate edge */}
        {fin > 0.01
          ? Array.from({length: 6}, (_, i) => {
              const y = i < 5 ? plateY(i) : 5 * FH + 0.06;
              return (
                <group key={i} position={[0, y, 0]}>
                  <mesh position={[0, 0, P.d / 2 + 0.056]} scale={[fin, 1, 1]}>
                    <boxGeometry args={[P.w + 0.12, 0.028, 0.012]} />
                    <meshBasicMaterial color={COLORS.highlight} />
                  </mesh>
                  <mesh position={[P.w / 2 + 0.056, 0, 0]} scale={[1, 1, fin]}>
                    <boxGeometry args={[0.012, 0.028, P.d + 0.12]} />
                    <meshBasicMaterial color={COLORS.highlight} />
                  </mesh>
                  <mesh position={[-P.w / 2 - 0.056, 0, 0]} scale={[1, 1, fin]}>
                    <boxGeometry args={[0.012, 0.028, P.d + 0.12]} />
                    <meshBasicMaterial color={COLORS.highlight} />
                  </mesh>
                </group>
              );
            })
          : null}

        {/* site: plinth, entrance path, hedges, small trees */}
        {podium > 0.01 ? (
          <group>
            <mesh position={[0, 0.04, 0.3]} scale={[podium, 1, podium]} receiveShadow>
              <boxGeometry args={[P.w + 3.2, 0.08, P.d + 3.4]} />
              <meshStandardMaterial color="#E7ECF3" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.085, P.d / 2 + 1.0]} scale={[1, 1, site(1)]} receiveShadow>
              <boxGeometry args={[P.w * 0.5, 0.012, 2.0]} />
              <meshStandardMaterial color="#C9D6EE" roughness={0.6} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (P.w / 2 + 1.3), 0.2, 0.3]} scale={[1, site(2), site(2)]} castShadow>
                <boxGeometry args={[0.32, 0.26, P.d + 2.6]} />
                <meshStandardMaterial color={COLORS.highlight} roughness={0.7} />
              </mesh>
            ))}
            {trees.map(([x, z], k) => {
              const t = site(2 + k);
              return t > 0.01 ? (
                <group key={k} position={[x, 0.08, z]} scale={t}>
                  <mesh position={[0, 0.32, 0]} castShadow>
                    <cylinderGeometry args={[0.035, 0.045, 0.64, 8]} />
                    <meshStandardMaterial color={COLORS.ink} />
                  </mesh>
                  <mesh position={[0, 0.82, 0]} castShadow>
                    <sphereGeometry args={[0.34, 24, 16]} />
                    <meshStandardMaterial color="#CFDDF7" roughness={0.6} />
                  </mesh>
                </group>
              ) : null;
            })}
          </group>
        ) : null}

        {/* the invented, oversized balcony */}
        {bigP > 0 && fallT < 1.2 ? (
          <group
            position={[P.w * 0.18 + fallT * 0.8, plateY(BIG.floor) - 4.9 * fallT * fallT * (knocked ? 1 : 0), P.d / 2 + (BIG.depth * bigP) / 2]}
            rotation={[knocked ? fallT * 1.6 : 0, 0, knocked ? -fallT * 0.8 : 0]}
          >
            <group scale={[1, 1, bigP]}>
              <mesh castShadow>
                <boxGeometry args={[BIG.w, 0.1, BIG.depth]} />
                <meshStandardMaterial color={COLORS.ink} roughness={0.45} />
                <Edges color={COLORS.highlight} />
              </mesh>
              <mesh position={[0, 0.052, 0]} material={hatchTop}>
                <boxGeometry args={[BIG.w * 0.98, 0.004, BIG.depth * 0.96]} />
              </mesh>
              <mesh position={[0, 0.2, BIG.depth / 2]}>
                <boxGeometry args={[BIG.w, 0.3, 0.02]} />
                <meshStandardMaterial color={COLORS.highlight} transparent opacity={0.6} depthWrite={false} />
              </mesh>
            </group>
            {expose > 0 ? (
              <group position={[0, 0.55, BIG.depth * bigP * 0.5 + 0.1]} scale={expose * 0.9}>
                <mesh rotation={[0, 0, Math.PI / 4]}>
                  <boxGeometry args={[0.13, 1.25, 0.08]} />
                  <meshStandardMaterial color={COLORS.ink} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 4]}>
                  <boxGeometry args={[0.13, 1.25, 0.08]} />
                  <meshStandardMaterial color={COLORS.ink} />
                </mesh>
              </group>
            ) : null}
          </group>
        ) : null}
        <BuildingWire params={P} draw={expose} opacity={(1 - restore) * (1 - sink)} width={3} windows={false} />
        <Check3D p={restore * (1 - sink)} position={[P.w / 2 + 0.3, H + 0.65, P.d / 2]} size={0.45} yaw={25} />

        {sw > 0 && sw < 1 ? (
          <mesh position={panelPos} quaternion={cam.quaternion}>
            <boxGeometry args={[9, 22, 0.2]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>
        ) : null}

        {/* the ground line that becomes Scene 05's review rail */}
        <Beam length={lerp(0, 60, prog(f, OUT + 2, 16, EASE.inOut))} position={[0, 0, 2]} width={0.3} rotationY={0} core={1} />
      </Stage>

      <Streaks p={prog(f, -6, 22, EASE.out)} angle={18} count={18} opacity={0.6} />

      <Sfx at={BEATS[0]} name="sweep" volume={0.5} />
      <Sfx at={INVENT} name="slam" volume={0.6} />
      <Sfx at={SWEEP.from + 2} name="whoosh" volume={0.7} />
      <Sfx at={RESTORE} name="resolve" volume={0.5} />
    </AbsoluteFill>
  );
};
