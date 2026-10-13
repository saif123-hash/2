import * as THREE from 'three';
import {FONT_FAMILY} from '../config/theme';

/**
 * Arabic text rasterised by Chrome's own text engine (HarfBuzz shaping,
 * correct joining + RTL), then used as an alpha mask on 3D planes.
 */
export type TextTex = {texture: THREE.CanvasTexture; w: number; h: number; fontPx: number};

const cache = new Map<string, TextTex>();
const measureCtx = () => {
  const c = document.createElement('canvas');
  return c.getContext('2d')!;
};
let mctx: CanvasRenderingContext2D | null = null;

export const fontString = (weight: number, px: number) => `${weight} ${px}px "${FONT_FAMILY}"`;

export const measure = (text: string, weight: number, px: number, letterSpacing = 0) => {
  mctx = mctx ?? measureCtx();
  mctx.font = fontString(weight, px);
  (mctx as unknown as {letterSpacing: string}).letterSpacing = `${letterSpacing}px`;
  return mctx.measureText(text).width;
};

export const textTexture = (text: string, weight = 900, fontPx = 220, dir: 'rtl' | 'ltr' = 'rtl', letterSpacing = 0): TextTex => {
  const key = `${text}|${weight}|${fontPx}|${dir}|${letterSpacing}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const padX = fontPx * 0.12;
  const w = Math.ceil(measure(text, weight, fontPx, letterSpacing) + padX * 2);
  const h = Math.ceil(fontPx * 1.7);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.font = fontString(weight, fontPx);
  (ctx as unknown as {letterSpacing: string}).letterSpacing = `${letterSpacing}px`;
  ctx.direction = dir;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  // baseline placed so Arabic ascenders (hamza, shadda) and descenders fit
  ctx.fillText(text, w / 2, h * 0.64);
  const texture = new THREE.CanvasTexture(c);
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  const out = {texture, w, h, fontPx};
  cache.set(key, out);
  return out;
};

let hatch: THREE.CanvasTexture | null = null;
/** Diagonal architectural hatch (ink on pale blue) for anything not approved. */
export const hatchTexture = () => {
  if (hatch) return hatch;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#D8E5FF';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#19324D';
  ctx.lineWidth = 7;
  for (let k = -64; k <= 128; k += 22) {
    ctx.beginPath();
    ctx.moveTo(k, 64);
    ctx.lineTo(k + 64, 0);
    ctx.stroke();
  }
  hatch = new THREE.CanvasTexture(c);
  hatch.wrapS = hatch.wrapT = THREE.RepeatWrapping;
  hatch.colorSpace = THREE.SRGBColorSpace;
  hatch.anisotropy = 8;
  return hatch;
};
