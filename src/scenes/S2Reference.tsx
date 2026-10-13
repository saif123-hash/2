import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ArLine} from '../components/ArLine';
import {CheckBadge, HatchDefs} from '../components/Marks';
import {APPROVED, Massing, MassingParams, WRONG, barTop, massingHeight, mixParams} from '../components/Massing';
import {Band, Camera, Sfx, Svg, Tag} from '../components/Primitives';
import {COPY} from '../config/copy';
import {COLORS, FONT_FAMILY, TEXT_RIGHT, VIDEO} from '../config/theme';
import {HANDOFF} from '../config/timeline';
import {EASE, Key, lerp, prog, track, tween} from '../lib/motion';

// ── Scene 02 · The original reference ─────────────────────────────────
// The reference line becomes the datum of the approved composition (R).
// Two outputs (A, B) arrive — identical to each other, both wrong.
// Floors, proportions and façade rhythm are checked one by one, the
// outputs are corrected onto R, then R expands into the perspective grid.

const DATUM = HANDOFF.datumY; // 860
const ROW2 = 1360; // world datum of the two outputs
const R = {cx: 540};
const A = {cx: 300};
const B = {cx: 780};
const OUT_SCALE = 0.62;
const BEAT = [86, 106, 126]; // label beats
const FIX = {at: 146, dur: 20};
const L1 = {y: 214, size: 104};
const L2 = {y: 352, size: 122};
const CHIPS_Y = 1505;
const GRID_AT = 168;
const END = 190;

export const S2Reference: React.FC = () => {
  const f = useCurrentFrame();

  // camera: starts close on the datum, pulls back to reveal the outputs,
  // finally dives into R (which becomes the grid of Scene 03)
  const camKeys: Key[] = [
    [0, 1.32],
    [34, 1.32],
    [64, 0.92, EASE.inOut],
    [GRID_AT - 4, 0.94, EASE.smooth],
    [END, 3.4, EASE.in],
  ];
  const cam = track(f, camKeys);
  const camY = track(f, [
    [GRID_AT - 4, 0],
    [END, 180, EASE.in],
  ]);
  const toScreenY = (wy: number) => DATUM + (wy - DATUM) * cam + camY;

  // R builds on the datum
  const rBuild = prog(f, 8, 26, EASE.smooth);
  // A and B build together (they are clones of each other)
  const abBuild = prog(f, 46, 18, EASE.smooth);
  const fix = prog(f, FIX.at, FIX.dur, EASE.inOut);
  const ab: MassingParams = mixParams(WRONG, APPROVED, fix);

  const beat = (i: number) => prog(f, BEAT[i], 12, EASE.out);
  const beatOn = (i: number) => (f >= BEAT[i] && f < (BEAT[i + 1] ?? FIX.at) ? 1 : 0);
  const mismatchFade = 1 - prog(f, FIX.at, 10, EASE.out);

  // floor counting ticks
  const countTicks = (cx: number, baseY: number, p: MassingParams, scale: number, start: number, wrong: boolean) => {
    const n = Math.round(p.floors);
    const out: React.ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const t = prog(f, start + i * 2, 6, EASE.out) * mismatchFade;
      if (t <= 0) continue;
      const y = baseY - ((i + 0.5) * p.barH + i * p.gap) * scale;
      const x = cx + (p.barW / 2) * scale + 18;
      const extra = wrong && i >= 5;
      out.push(
        <g key={i} opacity={t}>
          <circle cx={x + 10} cy={y} r={extra ? 13 : 11} fill={extra ? COLORS.highlight : COLORS.ink} stroke={COLORS.ink} strokeWidth={2} />
          <text x={x + 10} y={y + 6} textAnchor="middle" fontFamily={FONT_FAMILY} fontWeight={700} fontSize={15} fill={extra ? COLORS.ink : COLORS.bg}>
            {i + 1}
          </text>
        </g>,
      );
    }
    return out;
  };

  // overlay of the extra (6th) floor on an output, hatched
  const extraFloor = (cx: number) => {
    const t = beat(0) * mismatchFade;
    if (t <= 0) return null;
    const p = ab;
    const w = p.barW * OUT_SCALE;
    const y = ROW2 - (6 * p.barH + 5 * p.gap) * OUT_SCALE;
    return (
      <g opacity={t}>
        <rect x={cx - w / 2 - 6} y={y - 6} width={w + 12} height={p.barH * OUT_SCALE + 12} fill="url(#s2hatch)" stroke={COLORS.ink} strokeWidth={2.5} strokeDasharray="7 6" rx={6} />
      </g>
    );
  };

  // R's envelope projected onto an output (proportions check)
  const envelope = (cx: number) => {
    const t = beat(1) * mismatchFade;
    if (t <= 0) return null;
    const w = APPROVED.barW * OUT_SCALE;
    const h = massingHeight(APPROVED) * OUT_SCALE;
    const draw = prog(f, BEAT[1], 14, EASE.inOut);
    const per = 2 * (w + h);
    return (
      <rect
        x={cx - w / 2}
        y={ROW2 - h}
        width={w}
        height={h}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={3}
        strokeDasharray={`${per * draw} ${per}`}
        opacity={t}
      />
    );
  };

  // façade rhythm check: rings over the openings
  const rhythm = (cx: number, baseY: number, p: MassingParams, scale: number, wrong: boolean) => {
    const t = beat(2) * mismatchFade;
    if (t <= 0) return null;
    const y = baseY - (2.5 * p.barH + 2 * p.gap) * scale;
    const ks = wrong ? [-0.28, 0, 0.28] : [-0.33, -0.11, 0.11, 0.33];
    const pulse = 1 + 0.12 * Math.sin((f - BEAT[2]) * 0.5);
    return (
      <g opacity={t}>
        {ks.map((k, j) => (
          <circle
            key={j}
            cx={cx + k * p.barW * scale}
            cy={y}
            r={(wrong ? 24 : 18) * scale * pulse * (scale > 0.8 ? 1 : 1.4)}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={2.5}
            strokeDasharray={wrong ? '5 5' : undefined}
          />
        ))}
      </g>
    );
  };

  // relation signs: A = B, and (A,B) ≠ R until fixed
  const eqP = prog(f, 64, 10, EASE.out);
  const neqP = prog(f, 78, 10, EASE.out);
  const slash = 1 - prog(f, FIX.at + 8, 10, EASE.inOut);
  const sign = (x: number, y: number, p: number, s: number, withSlash: number) =>
    p > 0 ? (
      <g transform={`translate(${x} ${y}) scale(${s})`} stroke={COLORS.ink} strokeWidth={7} strokeLinecap="round" opacity={p}>
        <line x1={-26 * p} y1={-10} x2={26 * p} y2={-10} />
        <line x1={-26 * p} y1={10} x2={26 * p} y2={10} />
        {withSlash > 0 ? <line x1={14 * withSlash} y1={-26 * withSlash} x2={-14 * withSlash} y2={26 * withSlash} /> : null}
      </g>
    ) : null;

  // incoming band from Scene 01 settles into R's datum
  const bandP = prog(f, 0, 22, EASE.inOut);
  const datumW = 560 * cam;
  const band = {
    left: lerp(-60, 540 - datumW / 2, bandP),
    width: lerp(VIDEO.width + 120, datumW, bandP),
    height: lerp(HANDOFF.bandH, 12, bandP),
  };

  const exit = prog(f, GRID_AT - 6, 14, EASE.in);
  const gridP = prog(f, GRID_AT, END - GRID_AT, EASE.inOut);
  const rOp = 1 - prog(f, GRID_AT, 10, EASE.in);

  return (
    <AbsoluteFill>
      <Camera scale={cam} y={camY} pivot={[540, DATUM]}>
        <Svg>
          <HatchDefs id="s2hatch" spacing={10} width={2} />
          {/* approved composition R */}
          <g opacity={rOp}>
            <line x1={R.cx - 280} y1={DATUM + 3} x2={R.cx + 280} y2={DATUM + 3} stroke={COLORS.ink} strokeWidth={4} opacity={prog(f, 14, 8)} />
            <Massing cx={R.cx} baseY={DATUM} params={APPROVED} build={rBuild} />
            {countTicks(R.cx, DATUM, APPROVED, 1, BEAT[0], false)}
            {rhythm(R.cx, DATUM, APPROVED, 1, false)}
            {/* proportion dimensions on R */}
            {beat(1) * mismatchFade > 0 ? (
              <g opacity={beat(1) * mismatchFade} stroke={COLORS.ink} strokeWidth={2.5}>
                <line x1={R.cx - 160} y1={DATUM + 34} x2={lerp(R.cx - 160, R.cx + 160, prog(f, BEAT[1], 12))} y2={DATUM + 34} />
                <line x1={R.cx - 160} y1={DATUM + 24} x2={R.cx - 160} y2={DATUM + 44} />
                <line x1={R.cx + 160} y1={DATUM + 24} x2={R.cx + 160} y2={DATUM + 44} />
                <line x1={R.cx - 196} y1={DATUM} x2={R.cx - 196} y2={lerp(DATUM, barTop(APPROVED, DATUM, 4), prog(f, BEAT[1] + 3, 12))} />
              </g>
            ) : null}
            <CheckBadge x={R.cx + 190} y={barTop(APPROVED, DATUM, 4) - 16} r={26} p={prog(f, 30, 12)} />
          </g>

          {/* outputs A and B */}
          <g opacity={1 - exit}>
            {[A, B].map((o, k) => (
              <g key={k}>
                <line x1={o.cx - 170} y1={ROW2 + 3} x2={o.cx + 170} y2={ROW2 + 3} stroke={COLORS.ink} strokeWidth={4} opacity={prog(f, 40, 8)} />
                <Massing cx={o.cx} baseY={ROW2} params={ab} scale={OUT_SCALE} build={abBuild} />
                {extraFloor(o.cx)}
                {envelope(o.cx)}
                {countTicks(o.cx, ROW2, ab, OUT_SCALE, BEAT[0] + 2, true)}
                {rhythm(o.cx, ROW2, ab, OUT_SCALE, fix < 0.5)}
                <CheckBadge x={o.cx + 130} y={ROW2 - massingHeight(ab) * OUT_SCALE - 22} r={22} p={prog(f, FIX.at + 12, 12)} />
              </g>
            ))}
            {sign(540, ROW2 - 100, eqP, 1, 0)}
            {sign(540, (DATUM + ROW2 - 230) / 2 + 20, neqP, 1.15, neqP * slash)}
            {/* comparison guides from R down to the outputs */}
            {neqP > 0 ? (
              <g stroke={COLORS.ink} strokeWidth={2} strokeDasharray="4 8" opacity={0.55 * neqP * (1 - exit)}>
                <path d={`M ${R.cx - 160} ${DATUM + 60} L ${A.cx - 100} ${ROW2 - 260}`} />
                <path d={`M ${R.cx + 160} ${DATUM + 60} L ${B.cx + 100} ${ROW2 - 260}`} />
              </g>
            ) : null}
          </g>
        </Svg>
      </Camera>

      {/* the incoming thread: settles as R's datum */}
      {bandP < 1 ? (
        <Band left={band.left} top={toScreenY(DATUM) - band.height / 2 + 3 * cam} width={band.width} height={band.height} core={1} opacity={1} />
      ) : null}

      {/* label chips: one beat each, the active one is filled */}
      {COPY.s2.labels.map((t, i) => (
        <Tag
          key={i}
          text={t}
          index={`0${i + 1}`}
          x={[1000, 696, 384][i]}
          y={CHIPS_Y}
          size={36}
          p={beat(i) * (1 - exit)}
          active={beatOn(i) ? 1 : f >= FIX.at ? 0.0 : 0}
        />
      ))}

      {/* perspective-grid hand-off */}
      {gridP > 0 ? <GridHandoff p={gridP} /> : null}

      <ArLine text={COPY.s2.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={6} stagger={4} mode="drop" outAt={GRID_AT - 8} outMode="rise" />
      <ArLine
        text={COPY.s2.line2}
        x={TEXT_RIGHT}
        y={L2.y}
        size={L2.size}
        inAt={50}
        stagger={4}
        mode="rise"
        hl={{at: 60, dur: 14, outAt: GRID_AT - 2, outDur: 10}}
        outAt={GRID_AT - 4}
        outMode="rise"
      />

      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={8 + i * 5} name="tick" rate={0.9 + i * 0.05} volume={0.6} />
      ))}
      <Sfx at={46} name="pop" volume={0.7} />
      <Sfx at={64} name="click" />
      <Sfx at={78} name="error" volume={0.55} />
      {BEAT.map((b, i) => (
        <Sfx key={`b${i}`} at={b} name="click" rate={1 + i * 0.1} />
      ))}
      <Sfx at={FIX.at} name="align" />
      <Sfx at={60} name="sweep" />
      <Sfx at={GRID_AT} name="whoosh" volume={0.4} />
    </AbsoluteFill>
  );
};

/** Lines grow out from R's centre into the flat grid that opens Scene 03. */
export const GRID = {
  cell: HANDOFF.gridCell,
  cy: HANDOFF.gridCenterY,
  halfX: 360,
  halfY: 420,
};

const GridHandoff: React.FC<{p: number}> = ({p}) => {
  const {cell, cy, halfX, halfY} = GRID;
  const lines: React.ReactNode[] = [];
  for (let x = -halfX; x <= halfX; x += cell) {
    const t = Math.min(1, Math.max(0, p * 1.4 - Math.abs(x) / halfX * 0.4));
    lines.push(<line key={`v${x}`} x1={540 + x} y1={cy - halfY * t} x2={540 + x} y2={cy + halfY * t} />);
  }
  for (let y = -halfY; y <= halfY; y += cell) {
    const t = Math.min(1, Math.max(0, p * 1.4 - Math.abs(y) / halfY * 0.4));
    lines.push(<line key={`h${y}`} x1={540 - halfX * t} y1={cy + y} x2={540 + halfX * t} y2={cy + y} />);
  }
  return (
    <Svg>
      <g stroke={COLORS.ink} strokeWidth={2.5} opacity={Math.min(1, p * 2)}>
        {lines}
      </g>
    </Svg>
  );
};
