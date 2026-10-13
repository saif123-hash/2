import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {EASE, EaseFn, clamp01, prog} from '../lib/motion';
import {measure, textTexture} from './textTexture';

/**
 * Extruded Arabic word: a front face plus a stack of offset layers that
 * read as a solid extrusion whenever the word turns. The word is shaped
 * as a whole, so its letters stay joined.
 *
 * Line3D takes CSS-style screen rows (y down) and converts them for the
 * HUD group, whose y axis points up.
 */
export type Word3DProps = {
  text: string;
  size: number;
  weight?: number;
  depth?: number;
  layers?: number;
  color?: string;
  side?: string;
  dir?: 'rtl' | 'ltr';
  letterSpacing?: number;
  opacity?: number;
  texPx?: number;
};

const SIDE = '#0B1B2C';

export const Word3D: React.FC<Word3DProps> = ({
  text,
  size,
  weight = 900,
  depth,
  layers = 14,
  color = COLORS.ink,
  side = SIDE,
  dir = 'rtl',
  letterSpacing = 0,
  opacity = 1,
  texPx = 256,
}) => {
  const tex = textTexture(text, weight, texPx, dir, letterSpacing * (texPx / size));
  const scale = size / tex.fontPx;
  const w = tex.w * scale;
  const h = tex.h * scale;
  const d = depth ?? size * 0.22;
  // canvas baseline sits at 64% height; nudge so the letter bodies centre on y
  const yOff = -0.035 * h;
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const sideCol = useMemo(() => new THREE.Color(side), [side]);
  const faded = opacity < 0.999;
  if (opacity <= 0.001) return null;
  return (
    <group>
      <group position={[0, yOff, 0]}>
        <mesh geometry={geo} scale={[w, h, 1]} renderOrder={1001}>
          <meshBasicMaterial map={tex.texture} color={color} transparent opacity={opacity} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
        {d > 0
          ? Array.from({length: layers}, (_, i) => {
              const t = (i + 1) / layers;
              const c = sideCol.clone().lerp(new THREE.Color(color), 0.25 * (1 - t));
              return (
                <mesh key={i} geometry={geo} scale={[w, h, 1]} position={[0, 0, -d * t]} renderOrder={1000}>
                  <meshBasicMaterial
                    map={tex.texture}
                    color={c}
                    alphaTest={faded ? 0 : 0.45}
                    transparent={faded}
                    opacity={opacity}
                    fog={false}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              );
            })
          : null}
      </group>
    </group>
  );
};

export type InMode3D = 'flip' | 'swing' | 'fly' | 'drop' | 'slam' | 'spin' | 'rise' | 'none';
export type OutMode3D = 'flipOut' | 'flyOut' | 'fall' | 'swingOut' | 'sink' | 'none';

export type HighlightSpec3D = {at: number; dur?: number; outAt?: number; outDur?: number; depth?: number};

export type Line3DProps = {
  text: string;
  x: number; // right edge (align right), centre (align center)
  y: number; // vertical centre of the line
  size: number;
  align?: 'right' | 'center';
  weight?: number;
  depth?: number;
  color?: string;
  inAt: number;
  inDur?: number;
  stagger?: number;
  mode?: InMode3D;
  ease?: EaseFn;
  outAt?: number;
  outDur?: number;
  outStagger?: number;
  outMode?: OutMode3D;
  hl?: HighlightSpec3D;
  maxWidth?: number;
  dir?: 'rtl' | 'ltr';
  letterSpacing?: number;
  /** extra whole-line transform */
  rotation?: [number, number, number];
  z?: number;
};

const deg = THREE.MathUtils.degToRad;

/** Layout helper exposed for hand-offs. */
export const lineLayout = (text: string, size0: number, weight = 900, maxWidth = 900, letterSpacing = 0) => {
  const words = text.split(' ');
  let size = size0;
  const total = (s: number) =>
    words.reduce((a, w) => a + measure(w, weight, s, letterSpacing), 0) + measure(' ', weight, s) * (words.length - 1);
  const t0 = total(size0);
  if (t0 > maxWidth) size = Math.floor((size0 * maxWidth) / t0);
  const widths = words.map((w) => measure(w, weight, size, letterSpacing));
  const space = measure(' ', weight, size);
  return {words, size, widths, space, width: total(size)};
};

export const Line3D: React.FC<Line3DProps> = ({
  text,
  x,
  y,
  size: size0,
  align = 'right',
  weight = 900,
  depth,
  color,
  inAt,
  inDur = 16,
  stagger = 3,
  mode = 'flip',
  ease = EASE.out,
  outAt,
  outDur = 12,
  outStagger = 2,
  outMode = 'flipOut',
  hl,
  maxWidth = 912,
  dir = 'rtl',
  letterSpacing = 0,
  rotation = [0, 0, 0],
  z = 0,
}) => {
  const f = useCurrentFrame();
  const {words, size, widths, space, width} = lineLayout(text, size0, weight, maxWidth, letterSpacing);
  const right = align === 'right' ? x : x + width / 2;
  const d = depth ?? size * 0.24;
  const order = dir === 'rtl' ? words.map((_, i) => i) : words.map((_, i) => i);

  let acc = 0;
  const items = order.map((i) => {
    const w = widths[i];
    const cx = dir === 'rtl' ? right - acc - w / 2 : right - width + acc + w / 2;
    acc += w + space;
    const p = mode === 'none' ? 1 : prog(f, inAt + i * stagger, inDur, ease);
    const q = outAt === undefined || outMode === 'none' ? 0 : prog(f, outAt + i * outStagger, outDur, EASE.in);
    if (p <= 0.001 || q >= 0.999) return null;
    let px = cx;
    let py = y;
    let pz = 0;
    let rx = 0;
    let ry = 0;
    let rz = 0;
    let s = 1;
    let hingeX = 0; // pivot offset for swing
    const u = 1 - p;
    switch (mode) {
      case 'flip':
        rx = 100 * u;
        pz = -260 * u;
        break;
      case 'swing':
        ry = -105 * u;
        hingeX = w / 2;
        break;
      case 'fly':
        pz = 1400 * u;
        ry = 28 * u;
        py += 120 * u;
        break;
      case 'drop':
        py -= 380 * u;
        rz = -14 * u;
        rx = -40 * u;
        break;
      case 'slam':
        pz = -2600 * u;
        rx = 18 * u;
        break;
      case 'spin':
        ry = 200 * u;
        s = 0.6 + 0.4 * p;
        break;
      case 'rise':
        py += 260 * u;
        rx = -70 * u;
        break;
      default:
        break;
    }
    switch (outMode) {
      case 'flipOut':
        rx += -100 * q;
        pz += 200 * q;
        break;
      case 'flyOut':
        pz += 2900 * q;
        ry += -20 * q;
        break;
      case 'fall':
        py += 600 * q * q;
        rz += 22 * q;
        break;
      case 'swingOut':
        ry += 105 * q;
        hingeX = -w / 2;
        break;
      case 'sink':
        pz += -1800 * q;
        rx += -30 * q;
        break;
      default:
        break;
    }
    const op = mode === 'fly' || mode === 'slam' || mode === 'spin' ? clamp01(p * 4) : 1;
    return (
      <group key={i} position={[px + hingeX, -py, pz]} rotation={[deg(rx), deg(ry), deg(-rz)]} scale={s}>
        <group position={[-hingeX, 0, 0]}>
          <Word3D text={words[i]} size={size} weight={weight} depth={d} color={color} dir={dir} letterSpacing={letterSpacing} opacity={op * (1 - clamp01((q - 0.85) / 0.15))} />
        </group>
      </group>
    );
  });

  // highlight slab drawn from the right edge, sitting behind the extrusion
  let hlNode: React.ReactNode = null;
  if (hl) {
    const hp = prog(f, hl.at, hl.dur ?? 12, EASE.inOut);
    const hq = hl.outAt !== undefined ? prog(f, hl.outAt, hl.outDur ?? 10, EASE.in) : 0;
    const vis = hp * (1 - hq);
    if (vis > 0.001) {
      const padX = size * 0.24;
      const W = width + padX * 2;
      const H = size * 1.18;
      const D = hl.depth ?? size * 0.16;
      const anchorX = hq > 0 ? right - width - padX : right + padX; // collapse to the left on exit
      hlNode = (
        <group position={[anchorX, -(y + size * 0.04), -d - D / 2 - 4]}>
          <group scale={[vis, 1, 1]}>
            <HighlightSlab x={hq > 0 ? W / 2 : -W / 2} w={W} h={H} d={D} />
          </group>
          {hp > 0.02 && hp < 0.98 ? (
            <mesh position={[-W * hp, 0, D / 2 + 2]}>
              <boxGeometry args={[Math.max(5, size * 0.05), H * 1.12, D]} />
              <meshBasicMaterial color={COLORS.ink} fog={false} toneMapped={false} />
            </mesh>
          ) : null}
        </group>
      );
    }
  }

  return (
    <group position={[0, 0, z]} rotation={[deg(rotation[0]), deg(rotation[1]), deg(rotation[2])]}>
      {hlNode}
      {items}
    </group>
  );
};

/** Pale-blue slab with slightly darker sides so it reads as a solid. */
export const HighlightSlab: React.FC<{x?: number; y?: number; z?: number; w: number; h: number; d: number; color?: string; sideColor?: string}> = ({
  x = 0,
  y = 0,
  z = 0,
  w,
  h,
  d,
  color = COLORS.highlight,
  sideColor = '#A9C1EC',
}) => {
  const mats = useMemo(() => {
    const front = new THREE.MeshBasicMaterial({color, fog: false, toneMapped: false});
    const sideM = new THREE.MeshBasicMaterial({color: sideColor, fog: false, toneMapped: false});
    return [sideM, sideM, sideM, sideM, front, front];
  }, [color, sideColor]);
  return (
    <mesh position={[x, y, z]} material={mats} renderOrder={999.5}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
};
