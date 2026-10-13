import React, {useMemo} from 'react';
import * as THREE from 'three';
import {COLORS} from '../config/theme';
import {getOutlineFont} from '../lib/fonts';

/**
 * A glyph from Thmanyah Sans Black, extruded into a solid with a bevel.
 * Geometry is centred on x/z and stands on y = 0; `height` is the glyph
 * height in world units.
 */
const geoCache = new Map<string, THREE.ExtrudeGeometry>();

export const glyphGeometry = (char: string, height: number, depth: number) => {
  const key = `${char}|${height}|${depth}`;
  const hit = geoCache.get(key);
  if (hit) return hit;
  const font = getOutlineFont();
  const path = font.getPath(char, 0, 0, 1000);
  const sp = new THREE.ShapePath();
  for (const c of path.commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y);
    else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
  }
  const shapes = sp.toShapes(true);
  const bb = path.getBoundingBox();
  const s = height / (bb.y2 - bb.y1);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: depth / s,
    bevelEnabled: true,
    bevelThickness: 0.05 / s,
    bevelSize: 0.035 / s,
    bevelSegments: 4,
    curveSegments: 14,
  });
  geo.scale(s, s, s);
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
};

export const Digit3D: React.FC<{char: string; height: number; depth: number; color?: string; material?: THREE.Material}> = ({char, height, depth, color = COLORS.ink, material}) => {
  const geo = glyphGeometry(char, height, depth);
  const mat = useMemo(() => material ?? new THREE.MeshStandardMaterial({color, roughness: 0.36, metalness: 0.08}), [material, color]);
  return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
};
