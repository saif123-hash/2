import {Easing, interpolate} from 'remotion';

export type EaseFn = (t: number) => number;

// Motion vocabulary: hard acceleration, long smooth deceleration.
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: snappy arrival
  inOut: Easing.bezier(0.85, 0, 0.15, 1), // strong in-out for camera moves
  smooth: Easing.bezier(0.45, 0, 0.2, 1),
  in: Easing.bezier(0.6, 0, 0.9, 0.3), // exits / drops
  overshoot: Easing.bezier(0.3, 1.45, 0.5, 1), // only on emphasis points
  linear: (t: number) => t,
} satisfies Record<string, EaseFn>;

/** Clamped tween between two frames. */
export const tween = (
  frame: number,
  from: number,
  to: number,
  a: number,
  b: number,
  ease: EaseFn = EASE.out,
) =>
  interpolate(frame, [from, to], [a, b], {
    easing: ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** 0→1 progress between two frames. */
export const prog = (frame: number, from: number, dur: number, ease: EaseFn = EASE.out) =>
  tween(frame, from, from + Math.max(dur, 1), 0, 1, ease);

/**
 * Multi-keyframe track. Each key is [frame, value, easeIntoThisKey?].
 * Holds the first/last value outside the range.
 */
export type Key = [number, number, EaseFn?];
export const track = (frame: number, keys: Key[]): number => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (frame <= f1) return tween(frame, f0, f1, v0, v1, e ?? EASE.inOut);
  }
  return keys[keys.length - 1][1];
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Damped shake for impacts (deterministic). */
export const shake = (frame: number, at: number, amp = 10, dur = 10) => {
  const t = frame - at;
  if (t < 0 || t > dur) return 0;
  const decay = 1 - t / dur;
  return Math.sin(t * 2.7) * amp * decay * decay;
};
