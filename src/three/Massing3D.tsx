import React from 'react';
import {RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {clamp01} from '../lib/motion';
import {hatchTexture} from './textTexture';

/**
 * The project: a clean architectural model. Each floor is a navy floor
 * plate, a pale wall core, pale-blue windows on all four façades, and (on
 * the approved design) front balconies with glass railings. The ground
 * floor carries the entrance and canopy; the top carries a roof parapet.
 * All parameters are continuous so a wrong variant can morph into the
 * approved one.
 */
export type Params3D = {
  floors: number;
  w: number;
  h: number; // clear storey height (wall + windows)
  d: number;
  gap: number; // floor-plate thickness
  pattern: number; // 0 = approved (4 bays, balconies), 1 = wrong (3 strip windows, no balconies)
};

export const APPROVED_3D: Params3D = {floors: 5, w: 3.0, h: 0.62, d: 2.3, gap: 0.1, pattern: 0};
export const WRONG_3D: Params3D = {floors: 6, w: 3.7, h: 0.5, d: 2.0, gap: 0.1, pattern: 1};

export const mix3D = (a: Params3D, b: Params3D, t: number): Params3D => ({
  floors: a.floors + (b.floors - a.floors) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
  d: a.d + (b.d - a.d) * t,
  gap: a.gap + (b.gap - a.gap) * t,
  pattern: a.pattern + (b.pattern - a.pattern) * t,
});

export const storey = (p: Params3D) => p.h + p.gap;
export const height3D = (p: Params3D) => Math.ceil(p.floors - 1e-6) * storey(p) + 0.12;
/** centre height of floor i */
export const floorY = (p: Params3D, i: number) => i * storey(p) + storey(p) / 2;

export type FloorFx = {
  dx?: number;
  dy?: number;
  dz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  ry?: number;
  rz?: number;
  rx?: number;
  show?: number; // 0..1
  look?: 'ink' | 'pale' | 'hatch' | 'ghost';
  openings?: number; // 0..1 window visibility
  widthMul?: number;
};

let MATS: ReturnType<typeof makeMats> | null = null;
const makeMats = () => {
  const ht = hatchTexture().clone();
  ht.needsUpdate = true;
  ht.repeat.set(6, 1.5);
  return {
    ink: new THREE.MeshStandardMaterial({color: COLORS.ink, roughness: 0.45, metalness: 0.05}),
    wall: new THREE.MeshStandardMaterial({color: '#E4E9F1', roughness: 0.85}),
    glass: new THREE.MeshStandardMaterial({color: '#BFD3F6', roughness: 0.12, metalness: 0.0, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0.35}),
    rail: new THREE.MeshStandardMaterial({color: COLORS.highlight, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false}),
    door: new THREE.MeshStandardMaterial({color: '#0E1F31', roughness: 0.3}),
    pale: new THREE.MeshStandardMaterial({color: COLORS.highlight, roughness: 0.38, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0.25}),
    hatch: new THREE.MeshStandardMaterial({map: ht, roughness: 0.5, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.12}),
    ghost: new THREE.MeshStandardMaterial({color: COLORS.highlight, transparent: true, opacity: 0.35, depthWrite: false}),
    open: new THREE.MeshStandardMaterial({color: COLORS.highlight, roughness: 0.25, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0.55}),
  };
};
export const useSlabMaterials = () => {
  MATS = MATS ?? makeMats();
  return MATS;
};

const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; cast?: boolean}> = ({p, s, m, cast = true}) => (
  <mesh position={p} material={m} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);

/** Windows along one façade of length L, facing +z in local space. */
const FacadeWindows: React.FC<{L: number; h: number; bays: number; strip: boolean; amount: number; skip?: number[]}> = ({L, h, bays, strip, amount, skip = []}) => {
  const m = useSlabMaterials();
  if (amount <= 0.01) return null;
  const bw = L / bays;
  const ww = bw * (strip ? 0.84 : 0.62);
  const wh = h * (strip ? 0.42 : 0.7);
  return (
    <>
      {Array.from({length: bays}, (_, k) =>
        skip.includes(k) ? null : (
          <group key={k} position={[-L / 2 + bw * (k + 0.5), 0, 0]} scale={[amount, amount, 1]}>
            <Box p={[0, 0, 0.012]} s={[ww, wh, 0.03]} m={m.glass} cast={false} />
            <Box p={[0, -wh / 2 - 0.02, 0.03]} s={[ww + 0.06, 0.035, 0.06]} m={m.ink} cast={false} />
          </group>
        ),
      )}
    </>
  );
};

export const Floor3D: React.FC<{
  p: Params3D;
  index: number;
  look?: FloorFx['look'];
  openings?: number;
  widthMul?: number;
  balconies?: boolean;
}> = ({p, index, look = 'ink', openings = 1, widthMul = 1}) => {
  const m = useSlabMaterials();
  const w = p.w * widthMul;
  const {h, d, gap} = p;
  const FH = h + gap;
  const plateY = -FH / 2 + gap / 2;
  const coreY = -FH / 2 + gap + h / 2;
  const approved = p.pattern < 0.5;
  if (look !== 'ink') {
    const mat = look === 'pale' ? m.pale : look === 'hatch' ? m.hatch : m.ghost;
    return (
      <group>
        <Box p={[0, plateY, 0]} s={[w + 0.1, gap, d + 0.1]} m={m.ink} />
        <Box p={[0, coreY, 0]} s={[w, h, d]} m={mat} />
      </group>
    );
  }
  const bays = approved ? 4 : 3;
  const sideBays = approved ? 3 : 2;
  const ground = index === 0;
  const balc = approved && !ground;
  return (
    <group>
      {/* floor plate */}
      <Box p={[0, plateY, 0]} s={[w + 0.1, gap, d + 0.1]} m={m.ink} />
      {/* wall core */}
      <Box p={[0, coreY, 0]} s={[w, h, d]} m={m.wall} />
      {/* windows on all four façades */}
      <group position={[0, coreY, d / 2]}>
        <FacadeWindows L={w} h={h} bays={bays} strip={!approved} amount={openings} skip={ground && approved ? [1, 2] : ground ? [1] : []} />
      </group>
      <group position={[0, coreY, -d / 2]} rotation={[0, Math.PI, 0]}>
        <FacadeWindows L={w} h={h} bays={bays} strip={!approved} amount={openings} />
      </group>
      <group position={[w / 2, coreY, 0]} rotation={[0, Math.PI / 2, 0]}>
        <FacadeWindows L={d} h={h} bays={sideBays} strip={!approved} amount={openings} />
      </group>
      <group position={[-w / 2, coreY, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <FacadeWindows L={d} h={h} bays={sideBays} strip={!approved} amount={openings} />
      </group>
      {/* balconies: navy slab + glass railing, on the two outer front bays */}
      {balc
        ? [-1, 1].map((s) => (
            <group key={s} position={[s * w * 0.31, plateY, d / 2 + 0.21]}>
              <Box p={[0, 0, 0]} s={[w * 0.3, gap * 0.9, 0.42]} m={m.ink} />
              <Box p={[0, 0.16, 0.2]} s={[w * 0.3, 0.26, 0.02]} m={m.rail} cast={false} />
              <Box p={[0, 0.29, 0.2]} s={[w * 0.3, 0.025, 0.04]} m={m.ink} cast={false} />
            </group>
          ))
        : null}
      {/* entrance: door + canopy */}
      {ground ? (
        <group position={[0, coreY, d / 2]}>
          <Box p={[0, -h * 0.07, 0.02]} s={[w * (approved ? 0.4 : 0.26), h * 0.86, 0.04]} m={m.door} cast={false} />
          <Box p={[0, h * 0.42, 0.28]} s={[w * (approved ? 0.52 : 0.36), 0.06, 0.56]} m={m.ink} />
        </group>
      ) : null}
    </group>
  );
};

/** Hatched / pale stand-alone slab (invented or uninvited elements). */
export const Slab: React.FC<{w: number; h: number; d: number; look?: FloorFx['look']; openings?: number; pattern?: number; castShadow?: boolean}> = ({
  w,
  h,
  d,
  look = 'ink',
  castShadow = true,
}) => {
  const m = useSlabMaterials();
  const mat = look === 'pale' ? m.pale : look === 'hatch' ? m.hatch : look === 'ghost' ? m.ghost : m.ink;
  return <RoundedBox args={[w, h, d]} radius={Math.min(0.05, h * 0.2)} smoothness={3} material={mat} castShadow={castShadow} receiveShadow />;
};

/** footprint shrinks less than the height while appearing, then vanishes */
const xz = (show: number) => (0.3 + 0.7 * show) * Math.min(1, show / 0.2);

export const Massing3D: React.FC<{
  params?: Params3D;
  position?: [number, number, number];
  rotationY?: number; // deg
  scale?: number;
  floorFx?: (i: number) => FloorFx;
  openings?: number;
  roof?: boolean;
}> = ({params = APPROVED_3D, position = [0, 0, 0], rotationY = 0, scale = 1, floorFx, openings = 1, roof = true}) => {
  const m = useSlabMaterials();
  const n = Math.ceil(params.floors - 1e-6);
  const frac = params.floors - (n - 1);
  const topFx = floorFx ? floorFx(n - 1) : {};
  const topShow = clamp01(topFx.show ?? 1) * clamp01(frac);
  const FH = storey(params);
  return (
    <group position={position} rotation={[0, THREE.MathUtils.degToRad(rotationY), 0]} scale={scale}>
      {Array.from({length: n}, (_, i) => {
        const fx = floorFx ? floorFx(i) : {};
        const show = clamp01(fx.show ?? 1) * (i === n - 1 ? clamp01(frac) : 1);
        if (show <= 0.001) return null;
        return (
          <group
            key={i}
            position={[fx.dx ?? 0, floorY(params, i) + (fx.dy ?? 0), fx.dz ?? 0]}
            rotation={[THREE.MathUtils.degToRad(fx.rx ?? 0), THREE.MathUtils.degToRad(fx.ry ?? 0), THREE.MathUtils.degToRad(fx.rz ?? 0)]}
            scale={[(fx.sx ?? 1) * xz(show), (fx.sy ?? 1) * show, (fx.sz ?? 1) * xz(show)]}
          >
            <Floor3D p={params} index={i} look={fx.look} openings={(fx.openings ?? 1) * openings} widthMul={fx.widthMul ?? 1} />
          </group>
        );
      })}
      {/* roof: parapet + plant room, riding on the top floor */}
      {roof && topShow > 0.02 ? (
        <group
          position={[topFx.dx ?? 0, (n - 1) * FH + FH + (topFx.dy ?? 0), topFx.dz ?? 0]}
          scale={[xz(topShow), topShow, xz(topShow)]}
        >
          <Box p={[0, 0.06, 0]} s={[params.w + 0.1, 0.12, params.d + 0.1]} m={m.ink} />
          <Box p={[params.w * 0.18, 0.3, -params.d * 0.12]} s={[params.w * 0.3, 0.36, params.d * 0.34]} m={m.wall} />
        </group>
      ) : null}
    </group>
  );
};
