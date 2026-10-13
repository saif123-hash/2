import React, {useMemo} from 'react';
import {RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {clamp01} from '../lib/motion';
import {hatchTexture} from './textTexture';

/**
 * The approved composition in 3D: a stack of rounded slabs (floors) whose
 * front and side faces carry a rhythm of openings. All parameters are
 * continuous so a wrong variant can morph into the approved one.
 */
export type Params3D = {floors: number; w: number; h: number; d: number; gap: number; pattern: number};

export const APPROVED_3D: Params3D = {floors: 5, w: 3.0, h: 0.5, d: 2.2, gap: 0.2, pattern: 0};
export const WRONG_3D: Params3D = {floors: 6, w: 3.7, h: 0.38, d: 1.9, gap: 0.16, pattern: 1};

export const mix3D = (a: Params3D, b: Params3D, t: number): Params3D => ({
  floors: a.floors + (b.floors - a.floors) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
  d: a.d + (b.d - a.d) * t,
  gap: a.gap + (b.gap - a.gap) * t,
  pattern: a.pattern + (b.pattern - a.pattern) * t,
});

export const height3D = (p: Params3D) => Math.ceil(p.floors - 1e-6) * (p.h + p.gap) - p.gap;
export const floorY = (p: Params3D, i: number) => i * (p.h + p.gap) + p.h / 2;

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
  openings?: number; // 0..1
  widthMul?: number;
};

export const useSlabMaterials = () =>
  useMemo(() => {
    const ink = new THREE.MeshStandardMaterial({color: COLORS.ink, roughness: 0.42, metalness: 0.06});
    const pale = new THREE.MeshStandardMaterial({color: COLORS.highlight, roughness: 0.38, metalness: 0.0, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0.25});
    const ht = hatchTexture().clone();
    ht.needsUpdate = true;
    ht.repeat.set(5, 1);
    const hatch = new THREE.MeshStandardMaterial({map: ht, roughness: 0.5, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.12});
    const ghost = new THREE.MeshStandardMaterial({color: COLORS.highlight, transparent: true, opacity: 0.35, roughness: 0.4, depthWrite: false});
    const open = new THREE.MeshStandardMaterial({color: COLORS.highlight, roughness: 0.25, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0.55});
    return {ink, pale, hatch, ghost, open};
  }, []);

const Openings: React.FC<{w: number; h: number; d: number; pattern: number; amount: number; mat: THREE.Material}> = ({w, h, d, pattern, amount, mat}) => {
  if (amount <= 0.01) return null;
  const items: React.ReactNode[] = [];
  const t = 0.05;
  const dots = 1 - pattern;
  const slots = pattern;
  if (dots > 0.01) {
    const s = h * 0.42 * amount * dots;
    [-0.33, -0.11, 0.11, 0.33].forEach((k, j) => items.push(<mesh key={`f${j}`} material={mat} position={[k * w, 0, d / 2 + t / 2 - 0.01]}><boxGeometry args={[s, s, t]} /></mesh>));
    [-0.25, 0, 0.25].forEach((k, j) => items.push(<mesh key={`s${j}`} material={mat} position={[w / 2 + t / 2 - 0.01, 0, k * d]}><boxGeometry args={[t, s, s]} /></mesh>));
  }
  if (slots > 0.01) {
    const sw = w * 0.2 * amount * slots;
    const sh = h * 0.3 * amount * slots;
    [-0.28, 0, 0.28].forEach((k, j) => items.push(<mesh key={`F${j}`} material={mat} position={[k * w, 0, d / 2 + t / 2 - 0.01]}><boxGeometry args={[sw, sh, t]} /></mesh>));
    [-0.2, 0.2].forEach((k, j) => items.push(<mesh key={`S${j}`} material={mat} position={[w / 2 + t / 2 - 0.01, 0, k * d]}><boxGeometry args={[t, sh, d * 0.26 * amount * slots]} /></mesh>));
  }
  return <>{items}</>;
};

export const Slab: React.FC<{w: number; h: number; d: number; look?: FloorFx['look']; openings?: number; pattern?: number; castShadow?: boolean}> = ({
  w,
  h,
  d,
  look = 'ink',
  openings = 1,
  pattern = 0,
  castShadow = true,
}) => {
  const m = useSlabMaterials();
  const mat = look === 'pale' ? m.pale : look === 'hatch' ? m.hatch : look === 'ghost' ? m.ghost : m.ink;
  return (
    <group>
      <RoundedBox args={[w, h, d]} radius={Math.min(0.06, h * 0.2)} smoothness={3} material={mat} castShadow={castShadow} receiveShadow />
      {look === 'ink' ? <Openings w={w} h={h} d={d} pattern={pattern} amount={openings} mat={m.open} /> : null}
    </group>
  );
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
}> = ({params = APPROVED_3D, position = [0, 0, 0], rotationY = 0, scale = 1, floorFx, openings = 1}) => {
  const n = Math.ceil(params.floors - 1e-6);
  const frac = params.floors - (n - 1);
  return (
    <group position={position} rotation={[0, THREE.MathUtils.degToRad(rotationY), 0]} scale={scale}>
      {Array.from({length: n}, (_, i) => {
        const fx = floorFx ? floorFx(i) : {};
        const show = clamp01(fx.show ?? 1) * (i === n - 1 ? clamp01(frac) : 1);
        if (show <= 0.001) return null;
        const y = floorY(params, i);
        return (
          <group
            key={i}
            position={[fx.dx ?? 0, y + (fx.dy ?? 0), fx.dz ?? 0]}
            rotation={[THREE.MathUtils.degToRad(fx.rx ?? 0), THREE.MathUtils.degToRad(fx.ry ?? 0), THREE.MathUtils.degToRad(fx.rz ?? 0)]}
            scale={[(fx.sx ?? 1) * xz(show), (fx.sy ?? 1) * show, (fx.sz ?? 1) * xz(show)]}
          >
            <Slab w={params.w * (fx.widthMul ?? 1)} h={params.h} d={params.d} look={fx.look} openings={(fx.openings ?? 1) * openings} pattern={params.pattern} />
          </group>
        );
      })}
    </group>
  );
};
