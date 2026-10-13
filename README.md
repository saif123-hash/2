# ArchSaif Studio: 3D motion film (Remotion + Three.js)

A ~31-second vertical (1080×1920, 30fps) motion ad. It uses real-time 3D
geometry with extruded Arabic kinetic typography and no photos, renders or footage.

- Final export: `renders/archsaif-film.mp4` (H.264 + AAC)
- Contact sheet: `renders/contact-sheet.png`

## What's in it

- **3D stage per scene** (`src/three/Stage.tsx`). It has an orbit camera, soft key and rim
  lighting with shadows, a fogged floor that melts into the brand paper colour, and
  a camera-locked HUD layer for headlines.
- **Extruded Arabic headlines** (`src/three/Text3D.tsx`). Chrome shapes each word
  (correct joining and RTL), and the word is then stacked into a solid 3D extrusion. Words
  flip, swing, slam, spin and fly through the lens, and a pale-blue 3D slab draws in
  behind the key line.
- **Extruded 5 / 6 digits** built from the real Thmanyah Black outlines
  (`src/three/Digit3D.tsx`).
- **Slab massing** with openings, materials and morphing parameters
  (`src/three/Massing3D.tsx`), plus debris bursts, envelopes, beams and checks.
- The tempo is 112.5 BPM, so 1 beat = 16 frames and every cut lands on a beat.

## Run

```bash
npm install
# fonts: put the Thmanyah files in public/fonts/ (see public/fonts/README.md)
npm run studio            # live preview
npm run render            # → out/archsaif-film.mp4
```

WebGL is rendered with SwiftShader (`swangle`), so no GPU is needed. In a
container without Remotion's Chrome download, set
`REMOTION_BROWSER=/path/to/headless_shell`.

### Fonts (not committed)
The Thmanyah font license forbids redistributing the font files, so
`public/fonts/` is git-ignored.

## Where to edit

| What | File |
|---|---|
| All on-screen copy (Arabic + brand lock) | `src/config/copy.ts` |
| Colours, font | `src/config/theme.ts` |
| Scene lengths (beat-locked) | `src/config/timeline.ts` |
| Music / SFX volume | `src/config/audio.ts` |
| Per-scene choreography: camera shots, cues, layout constants at the top of each file | `src/scenes/S1Hook.tsx` … `S6Brand.tsx` |

Camera moves are written as `shotTrack` keyframes (target, distance, yaw,
pitch, roll, fov), so arcs and orbits interpolate cleanly.

## Audio
`npm run audio` regenerates `public/audio/*.wav`. The music and sound effects are
synthesised from oscillators and noise in `scripts/make_audio.py`, with no samples,
so they are original and free to use. The score reads the scene boundaries from
`timeline.ts`. It has risers into every cut, a drop on the sixth slab, a breakdown
while the review gate stops on the error, and a resolve chord under the logo.

## Logo
`public/brand/archsaif-logo.png` is the supplied logo with only its flat
backdrop keyed to transparency (`scripts/extract_logo.py`). The artwork itself is
unmodified.
