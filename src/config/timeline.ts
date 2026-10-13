// Scene lengths in frames (30fps). Scenes are cut back-to-back; every
// transition is a geometric match-cut (the outgoing scene ends in exactly
// the shape the incoming scene starts from), so there is no overlap.
export const SCENE_DURATIONS = {
  s1: 205,
  s2: 190,
  s3: 172,
  s4: 190,
  s5: 188,
  s6: 232,
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

// Shared hand-off geometry between scenes (screen space, px).
export const HANDOFF = {
  // S1 highlight -> S2 reference datum line
  datumY: 860,
  // S3 grid
  gridCenterY: 1040,
  gridCell: 120,
  // S4 ground line -> S5 review track
  trackY: 1130,
  // S5 playhead -> S6 highlight band (vertical centre of the S6 key line)
  s6KeyLineY: 1250,
  // Thickness of the travelling blue "thread" when it is a line
  bandH: 14,
} as const;
