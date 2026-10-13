import * as THREE from 'three';
import {EASE, EaseFn, tween} from '../lib/motion';

/**
 * A camera "shot" in orbit form: the camera looks at a target from a
 * distance, at a yaw/pitch around it, with an in-frame roll and lens fov.
 * Interpolating these (instead of raw positions) gives clean arcs.
 */
export type Shot = {
  tx: number;
  ty: number;
  tz: number;
  dist: number;
  yaw: number; // deg, 0 = camera on +z looking toward -z
  pitch: number; // deg, positive = camera above target
  roll: number; // deg
  fov: number; // deg (vertical)
};

export type ShotKey = [number, Partial<Shot>, EaseFn?];

/** Multi-key shot track; each key only overrides the fields it names. */
export const shotTrack = (frame: number, base: Shot, keys: ShotKey[]): Shot => {
  // resolve full shots for every key
  const full: [number, Shot, EaseFn][] = [];
  let cur = {...base};
  for (const [f, s, e] of keys) {
    cur = {...cur, ...s};
    full.push([f, cur, e ?? EASE.inOut]);
  }
  if (frame <= full[0][0]) return full[0][1];
  for (let i = 1; i < full.length; i++) {
    const [f1, s1, e] = full[i];
    const [f0, s0] = full[i - 1];
    if (frame <= f1) {
      const out = {} as Shot;
      (Object.keys(s0) as (keyof Shot)[]).forEach((k) => {
        out[k] = tween(frame, f0, f1, s0[k], s1[k], e);
      });
      return out;
    }
  }
  return full[full.length - 1][1];
};

const rad = THREE.MathUtils.degToRad;

export const solveShot = (s: Shot) => {
  const target = new THREE.Vector3(s.tx, s.ty, s.tz);
  const p = rad(s.pitch);
  const y = rad(s.yaw);
  const pos = new THREE.Vector3(
    s.tx + s.dist * Math.cos(p) * Math.sin(y),
    s.ty + s.dist * Math.sin(p),
    s.tz + s.dist * Math.cos(p) * Math.cos(y),
  );
  const m = new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0));
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad(s.roll)));
  return {position: pos, quaternion: q, fov: s.fov};
};
