import React, {useMemo} from 'react';
import * as THREE from 'three';
import {COLORS} from '../config/theme';

/** Deterministic debris burst: small cubes thrown out from an impact. */
const rand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const Burst: React.FC<{t: number; origin: [number, number, number]; count?: number; seed?: number; spread?: number; power?: number}> = ({
  t,
  origin,
  count = 26,
  seed = 7,
  spread = 1,
  power = 1,
}) => {
  const parts = useMemo(() => {
    const r = rand(seed);
    return Array.from({length: count}, () => {
      const a = r() * Math.PI * 2;
      const up = 0.4 + r() * 0.9;
      const sp = (1.5 + r() * 3.5) * power;
      return {
        v: [Math.cos(a) * sp * spread, up * sp, Math.sin(a) * sp * spread] as [number, number, number],
        s: 0.05 + r() * 0.11,
        spin: (r() - 0.5) * 14,
        pale: r() > 0.45,
      };
    });
  }, [count, seed, spread, power]);
  const mats = useMemo(
    () => ({
      ink: new THREE.MeshStandardMaterial({color: COLORS.ink, roughness: 0.5}),
      pale: new THREE.MeshStandardMaterial({color: COLORS.highlight, roughness: 0.4, emissive: new THREE.Color(COLORS.highlight), emissiveIntensity: 0.3}),
    }),
    [],
  );
  if (t <= 0 || t > 1.6) return null;
  const g = -9.5;
  return (
    <group position={origin}>
      {parts.map((p, i) => {
        const y = Math.max(-origin[1] + p.s / 2, p.v[1] * t + 0.5 * g * t * t);
        const k = Math.max(0, 1 - t / 1.6);
        return (
          <mesh key={i} position={[p.v[0] * t, y, p.v[2] * t]} rotation={[p.spin * t, p.spin * t * 0.7, 0]} scale={p.s * k} material={p.pale ? mats.pale : mats.ink} castShadow>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        );
      })}
    </group>
  );
};
