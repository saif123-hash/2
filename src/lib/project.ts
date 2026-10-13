// Minimal 3D → 2D projection for the abstract perspective grid.
export type Cam = {
  yaw: number; // degrees, rotation around vertical axis
  pitch: number; // degrees, rotation around horizontal axis
  roll: number; // degrees, in-screen rotation
  dist: number; // camera distance (px); larger = flatter perspective
  zoom: number;
  cx: number; // screen centre
  cy: number;
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Project a point on the plane (x, y, z) to screen [sx, sy, depthScale]. */
export const project = (x: number, y: number, z: number, cam: Cam): [number, number, number] => {
  const cy = Math.cos(rad(cam.yaw));
  const sy = Math.sin(rad(cam.yaw));
  const cp = Math.cos(rad(cam.pitch));
  const sp = Math.sin(rad(cam.pitch));
  // yaw (around Y)
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  // pitch (around X)
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  const s = cam.dist / (cam.dist + z2);
  let px = x1 * s * cam.zoom;
  let py = y2 * s * cam.zoom;
  const cr = Math.cos(rad(cam.roll));
  const sr = Math.sin(rad(cam.roll));
  const rx = px * cr - py * sr;
  const ry = px * sr + py * cr;
  px = rx;
  py = ry;
  return [cam.cx + px, cam.cy + py, s * cam.zoom];
};

export const pathOf = (pts: [number, number][], close = false) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + (close ? ' Z' : '');
