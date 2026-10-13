import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {PerspectiveCamera} from '@react-three/drei';
import {useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {Shot, solveShot} from './shot';

/**
 * One lit 3D stage per scene: brand-paper backdrop with matching fog (so
 * the floor melts into the background), soft key/rim lighting, a shadow
 * catcher floor with a faint construction grid, an orbit camera, and a
 * camera-locked HUD layer for the kinetic headlines.
 */
export const HUD_DIST = 5;

export type StageProps = {
  shot: Shot;
  children?: React.ReactNode;
  hud?: React.ReactNode;
  fog?: [number, number];
  grid?: number; // grid opacity
  gridSize?: number;
  floorShadow?: number;
  lightCenter?: [number, number, number];
  keyIntensity?: number;
  /** rotates the key light around the light centre (deg) */
  keyAngle?: number;
};

const DepthClear: React.FC = () => {
  // Rendered just before the HUD: wipes the depth buffer so headlines are
  // never cut by world geometry, while keeping their own extrusion depth.
  const mat = useMemo(() => new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, depthTest: false}), []);
  return (
    <mesh
      renderOrder={999}
      material={mat}
      position={[0, 0, -0.5]}
      onBeforeRender={(r) => {
        r.clearDepth();
      }}
    >
      <planeGeometry args={[0.01, 0.01]} />
    </mesh>
  );
};

const Grid: React.FC<{opacity: number; size: number}> = ({opacity, size}) => {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const n = 40;
    for (let i = -n; i <= n; i++) {
      pts.push(i * size, 0, -n * size, i * size, 0, n * size);
      pts.push(-n * size, 0, i * size, n * size, 0, i * size);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [size]);
  if (opacity <= 0) return null;
  return (
    <lineSegments geometry={geo} position={[0, 0.002, 0]}>
      <lineBasicMaterial color={COLORS.ink} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  );
};

export const Stage: React.FC<StageProps> = ({
  shot,
  children,
  hud,
  fog = [26, 60],
  grid = 0.035,
  gridSize = 1,
  floorShadow = 0.2,
  lightCenter = [0, 0, 0],
  keyIntensity = 2.3,
  keyAngle = 0,
}) => {
  const {width, height} = useVideoConfig();
  const cam = solveShot(shot);
  const k = (2 * HUD_DIST * Math.tan(THREE.MathUtils.degToRad(shot.fov) / 2)) / height;
  const [lx, ly, lz] = lightCenter;
  const ka = THREE.MathUtils.degToRad(keyAngle);
  const kx = 6 * Math.cos(ka) + 8 * Math.sin(ka);
  const kz = 8 * Math.cos(ka) - 6 * Math.sin(ka);
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      gl={{antialias: true, toneMapping: THREE.NoToneMapping, preserveDrawingBuffer: true}}
      style={{position: 'absolute', inset: 0}}
    >
      <color attach="background" args={[COLORS.bg]} />
      <fog attach="fog" args={[COLORS.bg, fog[0], fog[1]]} />
      <PerspectiveCamera makeDefault position={cam.position} quaternion={cam.quaternion} fov={cam.fov} near={0.05} far={300} />

      <hemisphereLight args={['#ffffff', '#aebbd0', 1.35]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[lx + kx, ly + 12, lz + kz]}
        target-position={[lx, ly, lz]}
        intensity={keyIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[lx - 8, ly + 5, lz - 9]} intensity={1.1} />
      <directionalLight position={[lx - 6, ly + 2, lz + 6]} intensity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <shadowMaterial opacity={floorShadow} />
      </mesh>
      <Grid opacity={grid} size={gridSize} />

      {children}

      {hud ? (
        <group position={cam.position} quaternion={cam.quaternion}>
          <DepthClear />
          <group position={[0, 0, -HUD_DIST]} scale={k}>
            {/* HUD space: pixels, origin top-left, y up (use -y for CSS rows) */}
            <group position={[-width / 2, height / 2, 0]}>
              {hud}
            </group>
          </group>
        </group>
      ) : null}
    </ThreeCanvas>
  );
};
