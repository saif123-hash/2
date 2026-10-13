import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ArLine} from '../components/ArLine';
import {CheckBadge, CrossMark, HatchDefs} from '../components/Marks';
import {APPROVED, Massing, barTop, massingHeight} from '../components/Massing';
import {Band, Camera, Sfx, Svg, Tag} from '../components/Primitives';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT, VIDEO} from '../config/theme';
import {HANDOFF} from '../config/timeline';
import {EASE, lerp, prog, track} from '../lib/motion';

// ── Scene 04 · Enhancement vs. invention ──────────────────────────────
// Directional lines lock into the approved composition. Materials,
// finishes and site elements make it richer — then an invented slab
// appears, is exposed outside the approved boundary, and a confident
// navy sweep removes it. The ground line becomes the review track.

const SCALE = 1.3;
const CX = 540;
const BASE = 930;
const P = APPROVED;
const BW = P.barW * SCALE;
const BH = P.barH * SCALE;
const GAP = P.gap * SCALE;
/** bar centres, top floor first (Scene 03 lands its lines here) */
export const S4_BAR_CENTERS = [4, 3, 2, 1, 0].map((i) => Math.round(BASE - (i + 0.5) * BH - i * GAP));
const barY = (i: number) => BASE - (i + 1) * BH - i * GAP;
const ENV = {x: CX - BW / 2 - 18, y: BASE - massingHeight(P) * SCALE - 18, w: BW + 36, h: massingHeight(P) * SCALE + 18};

const LOCK = 24;
const MAT = 44;
const FIN = 62;
const SITE = 80;
const INVENT = 98;
const EXPOSE = 110;
const SWEEP = {from: 126, to: 158};
const RESTORE = 154;
const OUT = 164;
const END = 190;
const L1 = {y: 1150, size: 104};
const L2 = {y: 1290, size: 128};
const SLAB = {y: barY(2) + BH * 0.18, h: BH * 0.64, w: 250};

export const S4Enhance: React.FC = () => {
  const f = useCurrentFrame();

  // directional lines → bars
  const lock = prog(f, 0, LOCK, EASE.inOut);
  const ang = lerp(-16, 0, lock);
  const len = lerp(1800, BW, lock);
  const thick = lerp(6, BH, lock);

  const openP = prog(f, LOCK - 4, 12);
  const matP = prog(f, MAT, 16, EASE.inOut);
  const finP = prog(f, FIN, 16, EASE.inOut);
  const siteP = prog(f, SITE, 18, EASE.out);
  const sweepLight = prog(f, FIN, 34, EASE.smooth);

  const slabP = prog(f, INVENT, 14, EASE.overshoot);
  const exposeP = prog(f, EXPOSE, 16, EASE.inOut);
  const crossP = prog(f, EXPOSE + 8, 12, EASE.out);
  const sw = prog(f, SWEEP.from, SWEEP.to - SWEEP.from, EASE.smooth);
  const swX = lerp(1500, -620, sw); // band centre x
  const SWW = 640; // band width
  const SKEW = 260; // horizontal offset between top and bottom of the band
  const yTop = 360;
  const yBot = 1080;
  const bandPoly = `${swX - SWW / 2 + SKEW / 2},${yTop} ${swX + SWW / 2 + SKEW / 2},${yTop} ${swX + SWW / 2 - SKEW / 2},${yBot} ${swX - SWW / 2 - SKEW / 2},${yBot}`;
  const notSwept = `-2000,${yTop - 400} ${swX - SWW / 2 + SKEW / 2 + (SKEW / (yBot - yTop)) * 400},${yTop - 400} ${swX - SWW / 2 - SKEW / 2 - (SKEW / (yBot - yTop)) * 400},${yBot + 400} -2000,${yBot + 400}`;
  const exposeFade = 1 - prog(f, SWEEP.from + 8, 10, EASE.in);
  const restoreP = prog(f, RESTORE, 12);

  const camS = track(f, [
    [EXPOSE, 1],
    [EXPOSE + 16, 1.2, EASE.inOut],
    [SWEEP.from + 6, 1.2],
    [RESTORE + 8, 1, EASE.inOut],
  ]);

  // exit: composition sinks under the ground line, which becomes the track
  const sink = prog(f, OUT, 16, EASE.in);
  const groundW = lerp(lerp(BW + 160, 860, siteP), VIDEO.width + 200, prog(f, OUT + 2, 16, EASE.inOut));
  const groundY = lerp(BASE + 4, HANDOFF.trackY, prog(f, OUT + 8, END - OUT - 8, EASE.inOut));
  const decoOut = 1 - prog(f, OUT - 6, 12, EASE.in);
  const tick = prog(f, END - 12, 12, EASE.out);

  const bars = [0, 1, 2, 3, 4].map((i) => (
    <rect key={i} x={CX - BW / 2} y={barY(i)} width={BW} height={BH} rx={6} />
  ));

  // labels retire when the invented element is exposed (focus + room for the punch-in)
  const tagP = (at: number) => prog(f, at, 12) * (1 - prog(f, EXPOSE - 2, 10, EASE.in));

  return (
    <AbsoluteFill>
      <Camera scale={camS} pivot={[260, SLAB.y]}>
        <Svg>
          <HatchDefs id="s4hatch" spacing={10} width={2.2} />
          <HatchDefs id="s4ground" spacing={14} width={2} />
          <defs>
            <pattern id="s4mat" patternUnits="userSpaceOnUse" width={BW} height={7}>
              <line x1={0} y1={3.5} x2={BW} y2={3.5} stroke={COLORS.highlight} strokeOpacity={0.22} strokeWidth={1.6} />
            </pattern>
            <linearGradient id="s4sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.38" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="s4bars">{bars}</clipPath>
            <clipPath id="s4band">
              <polygon points={bandPoly} />
            </clipPath>
            <clipPath id="s4keep">
              <polygon points={notSwept} />
            </clipPath>
            <clipPath id="s4above">
              <rect x={-500} y={-500} width={2100} height={BASE + 500} />
            </clipPath>
            <filter id="s4soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          {/* site: ground shadow, hatch strip, abstract planting & paving */}
          <g opacity={decoOut}>
            <ellipse cx={CX} cy={BASE + 10} rx={BW * 0.6 * finP} ry={18} fill={COLORS.ink} opacity={0.22 * finP} filter="url(#s4soft)" />
            {siteP > 0 ? (
              <g opacity={siteP}>
                <rect x={CX - 430 * siteP} y={BASE + 6} width={860 * siteP} height={26} fill="url(#s4ground)" opacity={0.45} />
                {[
                  [205, 36],
                  [272, 24],
                  [868, 30],
                  [930, 22],
                ].map(([x, r], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={BASE - r}
                    r={r * Math.min(1, Math.max(0, siteP * 1.6 - i * 0.15))}
                    fill={COLORS.highlight}
                    stroke={COLORS.ink}
                    strokeWidth={3}
                  />
                ))}
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <line key={k} x1={318 + k * 76} y1={BASE + 50} x2={318 + k * 76 + 44 * siteP} y2={BASE + 50} stroke={COLORS.ink} strokeWidth={4} strokeLinecap="round" />
                ))}
              </g>
            ) : null}
          </g>

          {/* the composition */}
          <g clipPath={sink > 0 ? 'url(#s4above)' : undefined}>
            <g transform={`translate(0 ${sink * (massingHeight(P) * SCALE + 30)})`}>
              {lock < 1 ? (
                [0, 1, 2, 3, 4].map((i) => {
                  const cy = barY(i) + BH / 2;
                  return (
                    <rect
                      key={i}
                      x={CX - len / 2}
                      y={cy - thick / 2}
                      width={len}
                      height={thick}
                      rx={Math.min(6, thick / 2)}
                      fill={COLORS.ink}
                      transform={`rotate(${ang} ${CX} ${cy})`}
                    />
                  );
                })
              ) : (
                <>
                  <Massing cx={CX} baseY={BASE} params={P} scale={SCALE} openings={openP} />
                  {/* materials: cladding lines */}
                  <g clipPath="url(#s4bars)">
                    <rect x={CX + BW / 2 - BW * matP} y={barY(4)} width={BW * matP} height={massingHeight(P) * SCALE} fill="url(#s4mat)" />
                    {/* finishes: crisp edge + travelling sheen */}
                    {finP > 0
                      ? [0, 1, 2, 3, 4].map((i) => (
                          <line key={i} x1={CX - BW / 2 + 8} y1={barY(i) + 4} x2={CX - BW / 2 + 8 + (BW - 16) * finP} y2={barY(i) + 4} stroke={COLORS.highlight} strokeWidth={2.5} strokeOpacity={0.8} />
                        ))
                      : null}
                    {sweepLight > 0 && sweepLight < 1 ? (
                      <rect
                        x={lerp(CX - BW, CX + BW * 0.6, sweepLight) - 90}
                        y={barY(4) - 40}
                        width={180}
                        height={massingHeight(P) * SCALE + 80}
                        fill="url(#s4sheen)"
                        transform={`skewX(-20)`}
                        style={{transformOrigin: `${CX}px ${BASE}px`}}
                      />
                    ) : null}
                  </g>
                </>
              )}

              {/* the invented slab (only where the sweep has not passed) */}
              {slabP > 0 ? (
                <g clipPath="url(#s4keep)">
                  <rect x={CX - BW / 2 - SLAB.w * slabP} y={SLAB.y} width={SLAB.w * slabP + 6} height={SLAB.h} rx={5} fill={COLORS.highlight} stroke={COLORS.ink} strokeWidth={3} />
                  <rect x={CX - BW / 2 - SLAB.w * slabP} y={SLAB.y} width={SLAB.w * slabP} height={SLAB.h} fill="url(#s4hatch)" opacity={0.35 * exposeP} />
                </g>
              ) : null}
            </g>
          </g>

          {/* exposure: approved boundary + cross */}
          {exposeP > 0 && exposeFade > 0 ? (
            <g opacity={exposeFade}>
              <rect
                x={ENV.x}
                y={ENV.y}
                width={ENV.w}
                height={ENV.h}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={3}
                strokeDasharray="12 9"
                pathLength={1000}
                style={{strokeDasharray: `${12} ${9}`}}
                opacity={exposeP}
              />
              <CrossMark x={CX - BW / 2 - SLAB.w / 2} y={SLAB.y + SLAB.h / 2} size={72} p={crossP} w={8} />
            </g>
          ) : null}

          {/* the navy sweep, with the approved composition inverted inside it */}
          {sw > 0 && sw < 1 ? (
            <g>
              <polygon points={bandPoly} fill={COLORS.ink} />
              <g clipPath="url(#s4band)">
                <Massing cx={CX} baseY={BASE} params={P} scale={SCALE} color={COLORS.bg} openColor={COLORS.ink} />
                <line x1={0} y1={BASE + 4} x2={VIDEO.width} y2={BASE + 4} stroke={COLORS.highlight} strokeWidth={6} />
              </g>
            </g>
          ) : null}

          <CheckBadge x={CX + BW / 2 + 6} y={barY(4) - 26} r={28} p={restoreP * decoOut} />

          {/* leader lines */}
          <g stroke={COLORS.ink} strokeWidth={2.5} opacity={decoOut}>
            {tagP(MAT) > 0 ? <line x1={CX + BW / 2 - 30} y1={barY(3) + BH / 2} x2={CX + BW / 2 - 30 + 90 * tagP(MAT)} y2={barY(3) + BH / 2 - 60 * tagP(MAT)} /> : null}
            {tagP(FIN) > 0 ? <line x1={CX - BW / 2 + 30} y1={barY(4) + 6} x2={CX - BW / 2 + 30 - 80 * tagP(FIN)} y2={barY(4) + 6 - 70 * tagP(FIN)} /> : null}
            {tagP(SITE) > 0 ? <line x1={905} y1={BASE - 26} x2={905} y2={BASE - 26 + 116 * tagP(SITE)} /> : null}
          </g>
        </Svg>
        {f < OUT ? (
        <svg width={VIDEO.width} height={VIDEO.height} style={{position: 'absolute', inset: 0}}>
          <line
            x1={CX - groundW / 2}
            y1={BASE + 4}
            x2={CX + groundW / 2}
            y2={BASE + 4}
            stroke={COLORS.ink}
            strokeWidth={4}
            opacity={prog(f, LOCK - 6, 8)}
          />
        </svg>
        ) : null}
        <Tag text={COPY.s4.labels[0]} x={CX + BW / 2 + 66} y={barY(3) + BH / 2 - 76} anchor="left" p={tagP(MAT)} size={36} />
        <Tag text={COPY.s4.labels[1]} x={CX - BW / 2 - 44} y={barY(4) - 70} anchor="right" p={tagP(FIN)} size={36} />
        <Tag text={COPY.s4.labels[2]} x={980} y={BASE + 134} anchor="right" p={tagP(SITE)} size={36} />

      </Camera>

      <ArLine text={COPY.s4.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={30} stagger={4} mode="rise" outAt={OUT - 4} outMode="rise" />
      <ArLine
        text={COPY.s4.line2}
        x={TEXT_RIGHT}
        y={L2.y}
        size={L2.size}
        inAt={EXPOSE + 4}
        inDur={16}
        stagger={4}
        mode="drop"
        hl={{at: EXPOSE + 12, dur: 12, outAt: OUT, outDur: 10}}
        outAt={OUT}
        outMode="rise"
      />

      {/* the track hand-off: ground line + the first review tick */}
      {f >= OUT ? (
        <>
          <Band left={CX - groundW / 2} top={groundY - 2} width={groundW} height={4} color={COLORS.ink} radius={2} />
          {tick > 0 ? <Band left={CX - 11} top={groundY - 130 * tick} width={22} height={130 * tick} core={1} coreVertical radius={4} /> : null}
        </>
      ) : null}

      <Sfx at={LOCK - 4} name="align" />
      <Sfx at={MAT} name="tick" />
      <Sfx at={FIN} name="tick" rate={1.15} />
      <Sfx at={SITE} name="pop" volume={0.7} />
      <Sfx at={INVENT + 6} name="pop" />
      <Sfx at={EXPOSE + 8} name="error" volume={0.7} />
      <Sfx at={SWEEP.from + 2} name="swoosh" volume={0.6} />
      <Sfx at={RESTORE} name="resolve" volume={0.7} />
      <Sfx at={END - 12} name="click" />
    </AbsoluteFill>
  );
};
