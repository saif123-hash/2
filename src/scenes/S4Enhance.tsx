import React, {useMemo} from 'react';
import {Edges} from '@react-three/drei';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT} from '../config/theme';
import {EASE, Key, lerp, prog, shake, track} from '../lib/motion';
import {Sfx, Streaks} from '../overlay/Overlays';
import {Beam, Check3D, EnvelopeBox} from '../three/Helpers';
import {HudBrackets, HudCross} from '../three/Hud';
import {APPROVED_3D, Massing3D, floorY, height3D, storey} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D, lineLayout} from '../three/Text3D';
import {Shot, shotTrack, solveShot} from '../three/shot';
import {hatchTexture} from '../three/textTexture';

// ── Scene 04 · Enhancement vs. invention ──────────────────────────────
// Part 1 — the camera dives into three close-ups and light reveals what is
// ALREADY in the approved building: its materials, its finishes, its site
// (entrance, path, trees). Nothing is added.
// Part 2 — the two things the post warns about appear: a bigger balcony and
// a different view. Both are crossed out and a navy sweep removes them.

const P = APPROVED_3D;
const H = height3D(P);
const FH = storey(P);
const plateY = (i: number) => floorY(P, i) - FH / 2 + P.gap / 2;
const CU = [20, 38, 56]; // close-up starts: materials, finishes, site
const WIDE = 72;
const BIG = 80; // bigger balcony
const VIEW = 90; // different view
const SWEEP = {from: 102, to: 116};
const RESTORE = 116;
const OUT = 126;
const END = 144;
const L1 = {y: 1262, size: 104};
const L2 = {y: 1412, size: 132};
const CHIP = {y: 260, size: 54};
const FRONT = P.d / 2;
const BAL_X = P.w * 0.31; // right-hand balcony
const BAL_FLOOR = 3;

const BASE: Shot = {tx: 0.3, ty: 1.4, tz: 0, dist: 14, yaw: -150, pitch: 20, roll: 26, fov: 30};
const WIDE_SHOT = {tx: 0.4, ty: 0.75, tz: 0.4, dist: 21.5, yaw: 18, pitch: 11, roll: 0};

const RAW_WALL = new THREE.Color('#BAC3CF');
const FIN_WALL = new THREE.Color('#F0F3F8');
const RAW_GLASS = new THREE.Color('#8C9DB6');
const FIN_GLASS = new THREE.Color('#C6D8F8');

export const S4Enhance: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotTrack(f, BASE, [
    [0, {}],
    [16, {...WIDE_SHOT, yaw: -20}, EASE.out],
    // close-up 1: upper windows + wall (materials)
    [CU[0] + 8, {tx: 0.7, ty: floorY(P, 3), tz: FRONT, dist: 8.2, yaw: 28, pitch: 4, roll: -3}, EASE.inOut],
    [CU[1], {yaw: 18, dist: 7.6}, EASE.smooth],
    // close-up 2: balcony rail + slab edges (finishes)
    [CU[1] + 7, {tx: -BAL_X, ty: plateY(2) + 0.25, tz: FRONT + 0.3, dist: 7.2, yaw: -32, pitch: 8, roll: 3}, EASE.inOut],
    [CU[2], {yaw: -24, dist: 6.8}, EASE.smooth],
    // close-up 3: entrance, path and trees (site)
    [CU[2] + 7, {tx: 0, ty: 0.55, tz: FRONT + 1.0, dist: 9.5, yaw: 12, pitch: 14, roll: 0}, EASE.inOut],
    [WIDE, {yaw: 4, dist: 9}, EASE.smooth],
    // wide again: the whole approved building
    [WIDE + 8, WIDE_SHOT, EASE.inOut],
    [BIG + 8, {tx: 1.0, ty: 1.4, dist: 15.5, yaw: 30, pitch: 10}, EASE.inOut],
    [VIEW + 8, {tx: 0, ty: 2.2, dist: 26, yaw: 14, pitch: 7}, EASE.inOut],
    [RESTORE + 6, {tx: 0.4, yaw: 24, dist: 22, ty: 0.75, pitch: 11}, EASE.inOut],
    [END, {tx: 0, ty: 0.2, tz: 2, dist: 9, yaw: 90, pitch: 4, roll: 0}, EASE.inOut],
  ]);
  shot.roll += shake(f + 2, SWEEP.from + 7, 1.4, 12);

  const build = (i: number) => prog(f, 2 + i * 2, 8, EASE.out);
  const sink = prog(f, OUT, 16, EASE.in);
  const mat = prog(f, CU[0] + 6, 14, EASE.inOut);
  const fin = prog(f, CU[1] + 6, 12, EASE.inOut) * (1 - sink);
  const siteGlow = prog(f, CU[2] + 6, 12, EASE.inOut) * (1 - sink);
  const sheen = prog(f, CU[0] + 8, 18, EASE.smooth);
  const keyAngle = lerp(-20, 50, prog(f, CU[1], 40, EASE.inOut));

  const mats = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({color: RAW_WALL.clone(), roughness: 0.9}),
      glass: new THREE.MeshStandardMaterial({color: RAW_GLASS.clone(), roughness: 0.3, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0}),
      rail: new THREE.MeshStandardMaterial({color: COLORS.highlight, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0}),
    }),
    [],
  );
  mats.wall.color.lerpColors(RAW_WALL, FIN_WALL, mat);
  mats.wall.roughness = lerp(0.9, 0.6, mat);
  mats.glass.color.lerpColors(RAW_GLASS, FIN_GLASS, mat);
  mats.glass.emissiveIntensity = 0.45 * mat;
  mats.glass.roughness = lerp(0.3, 0.08, mat);
  mats.rail.emissiveIntensity = 0.8 * fin;
  mats.rail.opacity = 0.55 + 0.25 * fin;

  // invented features
  const bigP = prog(f, BIG, 12, EASE.overshoot);
  const viewP = prog(f, VIEW, 14, EASE.out);
  const sw = prog(f, SWEEP.from, SWEEP.to - SWEEP.from, EASE.inOut);
  const removed = prog(f, SWEEP.from + 7, 6, EASE.in);
  const restore = prog(f, RESTORE, 10);

  const cam = solveShot(shot);
  const tgt = new THREE.Vector3(shot.tx, shot.ty, shot.tz);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  const panelPos = cam.position.clone().lerp(tgt, 0.3).addScaledVector(right, lerp(14, -14, sw));

  const floorFx = (i: number) => ({show: build(i) * (1 - prog(f, OUT + (4 - i) * 1.5, 10, EASE.in))});

  const hatchTop = useMemo(() => {
    const t = hatchTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(4, 3);
    return new THREE.MeshStandardMaterial({map: t, roughness: 0.6});
  }, []);

  // one chip at a time, centred under the counter
  const chips: {text: string; at: number; until: number; cross?: number}[] = [
    {text: COPY.s4.labels[0], at: CU[0] + 4, until: CU[1] + 2},
    {text: COPY.s4.labels[1], at: CU[1] + 4, until: CU[2] + 2},
    {text: COPY.s4.labels[2], at: CU[2] + 4, until: WIDE + 4},
    {text: COPY.s4.inventions[0], at: BIG + 2, until: VIEW + 1, cross: BIG + 5},
    {text: COPY.s4.inventions[1], at: VIEW + 2, until: SWEEP.from + 6, cross: VIEW + 6},
  ];
  const detailBrackets = f >= CU[0] + 6 && f < WIDE + 2 ? prog(f, CU.reduce((a, c) => (f >= c + 6 ? c + 6 : a), CU[0] + 6), 8, EASE.out) : 0;

  const trees: [number, number][] = [
    [-1.35, FRONT + 1.0],
    [1.35, FRONT + 1.0],
    [-1.35, FRONT + 2.0],
    [1.35, FRONT + 2.0],
  ];
  const towers: [number, number, number][] = [
    [-9, 4.2, 1.8],
    [-6.4, 6.2, 2.0],
    [-3.6, 5.0, 1.6],
    [-1.2, 3.4, 1.4],
    [3.2, 6.8, 2.2],
    [6.0, 4.8, 1.7],
    [8.8, 5.8, 1.9],
  ];

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[0, 1.5, 0]}
        keyAngle={keyAngle}
        keyIntensity={lerp(1.9, 2.5, fin)}
        grid={0.03}
        fog={[30, 90]}
        hud={
          <>
            {chips.map((c, i) => {
              const lay = lineLayout(c.text, CHIP.size, 700);
              const crossP = c.cross !== undefined ? prog(f, c.cross, 8, EASE.overshoot) : 0;
              return (
                <group key={i}>
                  <Line3D
                    text={c.text}
                    x={540}
                    y={CHIP.y}
                    align="center"
                    size={CHIP.size}
                    weight={700}
                    depth={10}
                    inAt={c.at}
                    inDur={10}
                    mode="flip"
                    hl={{at: c.at + 3, dur: 7, depth: 8, outAt: c.until - 2, outDur: 6}}
                    outAt={c.until}
                    outDur={8}
                    outMode="flipOut"
                  />
                  {f < c.until ? <HudCross x={540 - lay.width / 2 - 62} y={CHIP.y} size={44} p={crossP} /> : null}
                </group>
              );
            })}
            <HudBrackets x={150} y={420} w={780} h={720} len={60} opacity={detailBrackets * 0.9} />
            <Line3D text={COPY.s4.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={14} stagger={4} mode="rise" outAt={OUT - 2} outMode="fall" hl={{at: CU[0], dur: 10, outAt: WIDE + 6, outDur: 8}} />
            <Line3D
              text={COPY.s4.line2}
              x={TEXT_RIGHT}
              y={L2.y}
              size={L2.size}
              inAt={BIG}
              inDur={14}
              stagger={4}
              mode="flip"
              hl={{at: BIG + 10, dur: 10, outAt: OUT, outDur: 8}}
              outAt={OUT}
              outMode="fall"
            />
          </>
        }
      >
        <Massing3D params={P} floorFx={floorFx} mats={mats} />

        {/* materials: light sweeps across the façade */}
        {sheen > 0 && sheen < 1 ? (
          <mesh position={[lerp(-P.w * 0.9, P.w * 0.9, sheen), H / 2, FRONT + 0.09]} rotation={[0, 0, -0.35]}>
            <planeGeometry args={[0.45, H * 1.4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6 * Math.sin(sheen * Math.PI)} depthWrite={false} />
          </mesh>
        ) : null}

        {/* finishes: slab edges light up */}
        {fin > 0.01
          ? Array.from({length: 5}, (_, i) => (
              <group key={i} position={[0, plateY(i), 0]}>
                <mesh position={[0, 0, FRONT + 0.056]} scale={[fin, 1, 1]}>
                  <boxGeometry args={[P.w + 0.12, 0.03, 0.012]} />
                  <meshBasicMaterial color={COLORS.highlight} />
                </mesh>
                <mesh position={[P.w / 2 + 0.056, 0, 0]} scale={[1, 1, fin]}>
                  <boxGeometry args={[0.012, 0.03, P.d + 0.12]} />
                  <meshBasicMaterial color={COLORS.highlight} />
                </mesh>
              </group>
            ))
          : null}

        {/* site — part of the approved project from the start: path + trees */}
        {build(0) > 0 ? (
          <group scale={[1, build(0) * (1 - sink), 1]}>
            <mesh position={[0, 0.01, FRONT + 1.4]} receiveShadow>
              <boxGeometry args={[P.w * 0.5, 0.02, 2.6]} />
              <meshStandardMaterial
                color={new THREE.Color('#D3DCEA').lerp(new THREE.Color(COLORS.highlight), siteGlow)}
                emissive={COLORS.highlight}
                emissiveIntensity={0.5 * siteGlow}
                roughness={0.7}
              />
            </mesh>
            {trees.map(([x, z], k) => (
              <group key={k} position={[x, 0, z]}>
                <mesh position={[0, 0.3, 0]} castShadow>
                  <cylinderGeometry args={[0.03, 0.04, 0.6, 8]} />
                  <meshStandardMaterial color={COLORS.ink} />
                </mesh>
                <mesh position={[0, 0.72, 0]} castShadow>
                  <sphereGeometry args={[0.27, 24, 16]} />
                  <meshStandardMaterial color="#C9D7F2" emissive={COLORS.highlight} emissiveIntensity={0.45 * siteGlow} roughness={0.6} />
                </mesh>
              </group>
            ))}
            {siteGlow > 0.01 ? (
              <mesh position={[0, 0.03, FRONT + 1.4]} rotation={[-Math.PI / 2, 0, 0]} scale={0.6 + 0.4 * siteGlow}>
                <ringGeometry args={[1.75, 1.82, 64]} />
                <meshBasicMaterial color={COLORS.ink} transparent opacity={siteGlow * (1 - prog(f, WIDE, 10))} />
              </mesh>
            ) : null}
          </group>
        ) : null}

        {/* invention 1: a balcony that grows bigger than the approved one */}
        {bigP > 0 && removed < 1 ? (
          <group position={[BAL_X, plateY(BAL_FLOOR), FRONT]} scale={[1, 1, 1 - removed]}>
            <group position={[0, 0, (1.8 * bigP) / 2]} scale={[1 + 0.6 * bigP, 1, 1]}>
              <mesh castShadow>
                <boxGeometry args={[P.w * 0.3, 0.1, 1.8 * bigP + 0.001]} />
                <meshStandardMaterial color={COLORS.ink} roughness={0.45} />
                <Edges color={COLORS.highlight} />
              </mesh>
              <mesh position={[0, 0.052, 0]} material={hatchTop}>
                <boxGeometry args={[P.w * 0.3 * 0.97, 0.004, 1.8 * bigP * 0.97 + 0.001]} />
              </mesh>
              <mesh position={[0, 0.2, 0.9 * bigP]}>
                <boxGeometry args={[P.w * 0.3, 0.3, 0.02]} />
                <meshStandardMaterial color={COLORS.highlight} transparent opacity={0.6} depthWrite={false} />
              </mesh>
            </group>
          </group>
        ) : null}
        {/* the approved balcony size, dashed, for comparison */}
        <EnvelopeBox
          w={P.w * 0.3 + 0.08}
          h={0.4}
          d={0.5}
          position={[BAL_X, plateY(BAL_FLOOR) - 0.06, FRONT + 0.22]}
          opacity={prog(f, BIG + 6, 8) * (1 - removed)}
          dashed
        />

        {/* invention 2: a different view — a skyline and sun that are not the site */}
        {viewP > 0 && removed < 1 ? (
          <group position={[0, -8 * (1 - viewP) - 8 * removed, -15]}>
            <mesh position={[4.5, 7.2, -3]}>
              <circleGeometry args={[1.6, 48]} />
              <meshBasicMaterial color={COLORS.highlight} />
            </mesh>
            {towers.map(([x, h, w], k) => (
              <mesh key={k} position={[x, h / 2, 0]}>
                <boxGeometry args={[w, h, 1.2]} />
                <meshStandardMaterial color="#DDE6F7" roughness={0.8} />
                <Edges color={COLORS.ink} />
              </mesh>
            ))}
          </group>
        ) : null}

        <Check3D p={restore * (1 - sink)} position={[P.w / 2 + 0.3, H + 0.65, FRONT]} size={0.45} yaw={25} />

        {sw > 0 && sw < 1 ? (
          <mesh position={panelPos} quaternion={cam.quaternion}>
            <boxGeometry args={[9, 22, 0.2]} />
            <meshBasicMaterial color={COLORS.ink} />
          </mesh>
        ) : null}

        <Beam length={lerp(0, 60, prog(f, OUT + 2, 16, EASE.inOut))} position={[0, 0, 2]} width={0.3} rotationY={0} core={1} />
      </Stage>

      <Streaks p={prog(f, -6, 22, EASE.out)} angle={18} count={16} opacity={0.5} />

      <Sfx at={CU[0] + 6} name="click" />
      <Sfx at={CU[1] + 6} name="click" rate={1.1} />
      <Sfx at={CU[2] + 6} name="click" rate={1.2} />
      <Sfx at={BIG + 5} name="error" />
      <Sfx at={VIEW + 6} name="error" rate={0.94} />
      <Sfx at={SWEEP.from + 4} name="slam" volume={0.7} />
      <Sfx at={RESTORE} name="resolve" volume={0.5} />
    </AbsoluteFill>
  );
};
