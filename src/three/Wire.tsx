import React from 'react';
import {Line} from '@react-three/drei';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {APPROVED_3D, Params3D, storey} from './Massing3D';

/**
 * The approved design as a blueprint wireframe: floor lines, corners,
 * every window and balcony. It is laid over AI outputs as the reference —
 * where it fits, the output is faithful; where it doesn't, it's wrong.
 * `draw` (0..1) builds it from the ground up.
 */
export const BuildingWire: React.FC<{
  params?: Params3D;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  draw?: number;
  color?: string;
  width?: number;
  opacity?: number;
  windows?: boolean;
  xray?: boolean;
}> = ({params = APPROVED_3D, position = [0, 0, 0], rotationY = 0, scale = 1, draw = 1, color = '#4F7FD6', width = 2.6, opacity = 1, windows = true, xray = true}) => {
  if (draw <= 0.001 || opacity <= 0.001) return null;
  const n = Math.round(params.floors);
  const FH = storey(params);
  const {w, d, h, gap} = params;
  const top = n * FH + 0.12;
  const cut = draw * top;
  const pts: THREE.Vector3Tuple[] = [];
  const seg = (a: THREE.Vector3Tuple, b: THREE.Vector3Tuple) => {
    const lo = Math.min(a[1], b[1]);
    if (lo > cut) return;
    if (Math.max(a[1], b[1]) > cut) {
      // clip a vertical segment at the drawing height
      const t = (cut - a[1]) / (b[1] - a[1]);
      b = [a[0] + (b[0] - a[0]) * t, cut, a[2] + (b[2] - a[2]) * t];
    }
    pts.push(a, b);
  };
  const W = w / 2 + 0.05;
  const D = d / 2 + 0.05;
  const ring = (y: number, hw = W, hd = D) => {
    seg([-hw, y, hd], [hw, y, hd]);
    seg([hw, y, hd], [hw, y, -hd]);
    seg([hw, y, -hd], [-hw, y, -hd]);
    seg([-hw, y, -hd], [-hw, y, hd]);
  };
  for (let i = 0; i <= n; i++) ring(i * FH);
  ring(top);
  [
    [-W, D],
    [W, D],
    [W, -D],
    [-W, -D],
  ].forEach(([x, z]) => seg([x, 0, z], [x, top, z]));
  if (windows) {
    const rect = (cx: number, cy: number, z: number, rw: number, rh: number, side = false) => {
      const c = (u: number, v: number): THREE.Vector3Tuple => (side ? [z, cy + v, cx + u] : [cx + u, cy + v, z]);
      seg(c(-rw / 2, -rh / 2), c(rw / 2, -rh / 2));
      seg(c(rw / 2, -rh / 2), c(rw / 2, rh / 2));
      seg(c(rw / 2, rh / 2), c(-rw / 2, rh / 2));
      seg(c(-rw / 2, rh / 2), c(-rw / 2, -rh / 2));
    };
    const bays = 4;
    const bw = w / bays;
    const sb = d / 3;
    for (let i = 0; i < n; i++) {
      const cy = i * FH + gap + h / 2;
      for (let k = 0; k < bays; k++) {
        if (i === 0 && (k === 1 || k === 2)) continue;
        rect(-w / 2 + bw * (k + 0.5), cy, D, bw * 0.62, h * 0.7);
      }
      for (let k = 0; k < 3; k++) rect(-d / 2 + sb * (k + 0.5), cy, W, sb * 0.62, h * 0.7, true);
      if (i > 0) {
        // balconies
        [-1, 1].forEach((s) => {
          const bx = s * w * 0.31;
          const y = i * FH + gap / 2;
          seg([bx - w * 0.15, y, D], [bx - w * 0.15, y, D + 0.42]);
          seg([bx + w * 0.15, y, D], [bx + w * 0.15, y, D + 0.42]);
          seg([bx - w * 0.15, y, D + 0.42], [bx + w * 0.15, y, D + 0.42]);
          seg([bx - w * 0.15, y + 0.3, D + 0.42], [bx + w * 0.15, y + 0.3, D + 0.42]);
        });
      }
    }
    // entrance
    rect(0, gap + h * 0.43, D, w * 0.4, h * 0.86);
  }
  if (pts.length < 2) return null;
  return (
    <group position={position} rotation={[0, THREE.MathUtils.degToRad(rotationY), 0]} scale={scale}>
      <Line points={pts} segments color={color} lineWidth={width} transparent opacity={opacity} depthTest={!xray} renderOrder={500} />
    </group>
  );
};

export const WIRE_COLOR = '#4F7FD6';
export const INK = COLORS.ink;
