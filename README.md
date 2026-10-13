# ArchSaif Studio: motion film (Remotion)

A 39-second vertical (1080×1920, 30fps) motion-graphics ad built entirely with
Arabic kinetic typography and vector geometry. It uses no photos, renders or footage.

- Final export: `renders/archsaif-film.mp4` (H.264 + AAC, 1177 frames)
- Contact sheet: `renders/contact-sheet.png`

## Run

```bash
npm install
# fonts: copy the Thmanyah Sans .woff2 files into public/fonts/ (see below)
npm run studio            # live, scrubbable preview
npm run render            # → out/archsaif-film.mp4
```

In a container without Remotion's own Chrome download, point it at a local
headless shell: `REMOTION_BROWSER=/path/to/headless_shell npm run render`.

### Fonts (not committed)
The Thmanyah font license forbids redistributing the font files, so
`public/fonts/` is git-ignored. Place `thmanyahsans-{Light,Regular,Medium,Bold,Black}.woff2`
there (from https://thmanyah.com). Rendering waits for them to load.

## Where to edit

| What | File |
|---|---|
| All on-screen copy (Arabic + brand lock) | `src/config/copy.ts` |
| Colours, font, margins | `src/config/theme.ts` |
| Scene lengths and hand-off geometry between scenes | `src/config/timeline.ts` |
| Music / SFX volume, audio on/off | `src/config/audio.ts` |
| Per-scene choreography (keyframes are named constants at the top of each file) | `src/scenes/S1Hook.tsx` … `S6Brand.tsx` |

Reusable components:

- `components/ArLine.tsx`: the kinetic Arabic line. Words animate as whole,
  shaped units in reading order (rise / drop / scale / turn / slide / wipe),
  with an auto-fit width and a drawn highlight.
- `components/Primitives.tsx`: `Camera` (virtual 2D camera), `Band` (the
  travelling blue thread used for every hand-off), `Tag`, `Sfx`, `Svg`.
- `components/Massing.tsx`: the abstract "approved composition". Its
  parameters are continuous, so wrong variants morph into the approved one.
- `components/Marks.tsx`: hatch, check, cross and viewfinder brackets.
- `lib/motion.ts`: easing vocabulary, `track()` multi-keyframe helper, shake.
- `lib/project.ts`: 3D→2D projection for the perspective grid (Scene 03).

Every transition is a geometric match-cut. The outgoing scene ends on exactly
the shape the next scene starts from:
highlight → reference line → grid → directional lines → review track →
review indicator → final highlight → logo divider.

## Audio
`npm run audio` regenerates `public/audio/*.wav`. The music bed and all sound
effects are synthesised from oscillators and noise in `scripts/make_audio.py`,
with no samples or third-party audio, so they are original and free to use. The
score reads the scene boundaries from `timeline.ts`, so it stays in sync after
re-timing.

## Logo
`public/brand/archsaif-logo.png` is the supplied logo with only its flat grey
backdrop keyed to transparency (`scripts/extract_logo.py`). The artwork itself is
unmodified.
