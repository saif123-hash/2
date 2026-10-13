// Scene lengths in frames (30fps). The score runs at 112.5 BPM, so one
// beat = 16 frames: every cut lands on a beat.
export const BEAT = 16;

export const SCENE_DURATIONS = {
  s1: 160,
  s2: 144,
  s3: 128,
  s4: 144,
  s5: 144,
  s6: 208,
} as const;

export type SceneId = keyof typeof SCENE_DURATIONS;
export const SCENE_ORDER: SceneId[] = ['s1', 's2', 's3', 's4', 's5', 's6'];

export const SCENE_START: Record<SceneId, number> = (() => {
  let t = 0;
  const out = {} as Record<SceneId, number>;
  for (const id of SCENE_ORDER) {
    out[id] = t;
    t += SCENE_DURATIONS[id];
  }
  return out;
})();

export const TOTAL_FRAMES = SCENE_ORDER.reduce((a, id) => a + SCENE_DURATIONS[id], 0);
