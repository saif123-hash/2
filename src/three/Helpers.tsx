import React, {useMemo} from 'react';
import * as THREE from 'three';
import {COLORS, VIDEO} from '../config/theme';
import {Shot, solveShot} from './shot';

/** Wireframe + faint fill box: the approved envelope used for checks. */
export const EnvelopeBox: React.FC<{w: number; h: number; d: number; position?: [number, number, number]; opacity?: number; dashed?: boolean}> = ({
  w,
  h,
  d,
  position = [0, 0, 0],
  opacity = 1,
  dashed = false,
}) => {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), [w, h, d]);
  const lineRef = React.useCallback((l: THREE.LineSegments | null) => {
    if (l && dashed) l.computeLineDistances();
  }, [dashed]);
  if (opacity <= 0.001) return null;
  return (
    <group position={[position[0], position[1] + h / 2, position[2]]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color={COLORS.highlight} transparent opacity={0.28 * opacity} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} ref={lineRef}>
        {dashed ? (
          <lineDashedMaterial color={COLORS.ink} dashSize={0.18} gapSize={0.12} transparent opacity={opacity} />
        ) : (
          <lineBasicMaterial color={COLORS.ink} transparent opacity={opacity} />
        )}
      </lineSegments>
    </group>
  );
};

/** Long thin pale-blue beam with an ink core: the blue thread in the world. */
export const Beam: React.FC<{length: number; position?: [number, number, number]; rotationY?: number; width?: number; height?: number; core?: number}> = ({
  length,
  position = [0, 0, 0],
  rotationY = 0,
  width = 0.34,
  height = 0.05,
  core = 1,
}) => (
  <group position={position} rotation={[0, THREE.MathUtils.degToRad(rotationY), 0]}>
    <mesh position={[0, height / 2, 0]} receiveShadow>
      <boxGeometry args={[length, height, width]} />
      <meshStandardMaterial color={COLORS.highlight} emissive={COLORS.highlight} emissiveIntensity={0.5} roughness={0.4} />
    </mesh>
    {core > 0 ? (
      <mesh position={[0, height + 0.006, 0]} scale={[core, 1, 1]}>
        <boxGeometry args={[length, 0.012, width * 0.18]} />
        <meshBasicMaterial color={COLORS.ink} />
      </mesh>
    ) : null}
  </group>
);

/** World point → screen pixel (for HUD labels pinned to 3D objects). */
export const toScreen = (shot: Shot, p: [number, number, number]): [number, number, number] => {
  const c = solveShot(shot);
  const cam = new THREE.PerspectiveCamera(c.fov, VIDEO.width / VIDEO.height, 0.05, 300);
  cam.position.copy(c.position);
  cam.quaternion.copy(c.quaternion);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return [((v.x + 1) / 2) * VIDEO.width, ((1 - v.y) / 2) * VIDEO.height, v.z];
};

/** Check badge standing in the world, facing +z (rotate with `yaw`). */
export const Check3D: React.FC<{p: number; position: [number, number, number]; size?: number; yaw?: number}> = ({p, position, size = 0.5, yaw = 0}) => {
  if (p <= 0.001) return null;
  const s = size * (0.4 + 0.6 * Math.min(1, p * 1.3));
  const a = Math.min(1, p * 2);
  const b = Math.max(0, Math.min(1, p * 2 - 1));
  return (
    <group position={position} scale={s} rotation={[0, THREE.MathUtils.degToRad(yaw), 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.14, 40]} />
        <meshStandardMaterial color={COLORS.highlight} emissive={COLORS.highlight} emissiveIntensity={0.45} />
      </mesh>
      <group position={[0, 0, 0.1]}>
        <mesh position={[-0.17, -0.05, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(45)]} scale={[1, a, 1]}>
          <boxGeometry args={[0.13, 0.36, 0.1]} />
          <meshStandardMaterial color={COLORS.ink} />
        </mesh>
        <mesh position={[0.1, 0.07, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(-40)]} scale={[1, b, 1]}>
          <boxGeometry args={[0.13, 0.66, 0.1]} />
          <meshStandardMaterial color={COLORS.ink} />
        </mesh>
      </group>
    </group>
  );
};
