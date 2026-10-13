import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ArLine} from '../components/ArLine';
import {CheckBadge, HatchDefs} from '../components/Marks';
import {Massing, MassingParams} from '../components/Massing';
import {Band, Sfx, Svg} from '../components/Primitives';
import {COPY} from '../config/copy';
import {COLORS, TEXT_RIGHT, VIDEO} from '../config/theme';
import {HANDOFF} from '../config/timeline';
import {EASE, Key, lerp, prog, track} from '../lib/motion';

// ── Scene 05 · Review the entire video ────────────────────────────────
// One state, then the camera pulls back to the whole sequence. First and
// last states pass; the review indicator travels the sequence, stops on
// the transition where the openings drop out, fixes it, and moves on.

const TRACK = HANDOFF.trackY;
const N = 7;
const STEP = 320;
const ERR = 4; // index of the faulty in-between state
const NODE: MassingParams = {floors: 5, barW: 150, barH: 22, gap: 7, pattern: 0};
const NODE_H = 5 * 22 + 4 * 7;
const ERR_AT = 100;
const FIX_AT = 118;
const RESUME = 134;
const DONE = 158;
const OUT = 160;
const END = 188;
const L1 = {y: 214, size: 104};
const L2 = {y: 352, size: 128};
const SUP = {y: 1318, size: 46};
const PH_H = 360;

export const S5Review: React.FC = () => {
  const f = useCurrentFrame();

  const ph = track(f, [
    [60, 0],
    [ERR_AT, ERR * STEP, EASE.smooth],
    [RESUME, ERR * STEP],
    [DONE, (N - 1) * STEP, EASE.smooth],
  ]);
  const sKeys: Key[] = [
    [0, 2.5],
    [12, 2.5],
    [46, 0.42, EASE.inOut],
    [54, 0.42],
    [70, 0.95, EASE.inOut],
    [ERR_AT - 4, 0.95],
    [ERR_AT + 8, 1.5, EASE.out],
    [RESUME - 2, 1.5],
    [RESUME + 10, 0.95, EASE.inOut],
  ];
  const s = track(f, sKeys);
  const follow = prog(f, 54, 16, EASE.inOut);
  const overviewFx = track(f, [
    [12, 0],
    [46, ((N - 1) * STEP) / 2, EASE.inOut],
  ]);
  const fx = lerp(overviewFx, ph, follow);
  const toX = (wx: number) => 540 + (wx - fx) * s;

  const out = prog(f, OUT, 14, EASE.in);
  const errP = prog(f, ERR_AT + 2, 14, EASE.out);
  const fixP = prog(f, FIX_AT, 14, EASE.inOut);

  const nodes = Array.from({length: N}, (_, i) => {
    const wx = i * STEP;
    const appear = i === 0 ? prog(f, 0, 14, EASE.out) : prog(f, 16 + i * 3, 12, EASE.out);
    const passed = follow > 0 && ph >= wx - 2 && f >= 60;
    const skew = lerp(-16, 16, i / (N - 1));
    const isErr = i === ERR;
    const missingP = isErr ? (f < ERR_AT - 30 ? 1 : 1 - fixP) : 0;
    const topW = isErr ? lerp(0.66, 1, fixP) : 1;
    const endCheck = (i === 0 || i === N - 1) && f >= 40 ? prog(f, 40 + (i ? 4 : 0), 12) : 0;
    const passCheck = passed && !(isErr && f < FIX_AT + 8) ? prog(f, Math.max(60, f - 6), 6) : 0;
    return {wx, appear, skew, isErr, missingP, topW, check: Math.max(endCheck, i === 0 || i === N - 1 ? 0 : passCheck)};
  });

  const ticks: React.ReactNode[] = [];
  for (let wx = -STEP / 2; wx <= (N - 1) * STEP + STEP / 2; wx += STEP / 8) {
    const major = Math.abs(((wx % STEP) + STEP) % STEP) < 1;
    ticks.push(<line key={wx} x1={wx} y1={8} x2={wx} y2={major ? 30 : 18} />);
  }

  const trackW = prog(f, 8, 36, EASE.inOut);
  const phOn = prog(f, 56, 10, EASE.out);
  const phX = toX(ph);

  // hand-off: indicator stretches & turns into the final highlight band
  const m = prog(f, OUT + 4, END - OUT - 4, EASE.inOut);
  const hb = {
    cx: lerp(phX, 540, m),
    cy: lerp(TRACK - PH_H / 2, HANDOFF.s6KeyLineY, m),
    w: lerp(PH_H, VIDEO.width + 120, m),
    h: lerp(26, HANDOFF.bandH, m),
    rot: lerp(90, 0, m),
  };

  return (
    <AbsoluteFill>
      <Svg>
        <HatchDefs id="s5hatch" spacing={8} width={1.8} />
        <g opacity={1 - out}>
          {/* reviewed portion of the sequence */}
          <rect x={Math.min(toX(0), phX)} y={TRACK - 7} width={Math.max(0, phX - toX(0)) * phOn} height={14} fill={COLORS.highlight} />
          <line
            x1={lerp(-80, toX(-STEP / 2), trackW)}
            y1={TRACK}
            x2={Math.max(toX((N - 1) * STEP + STEP / 2), lerp(VIDEO.width + 80, toX((N - 1) * STEP + STEP / 2), trackW))}
            y2={TRACK}
            stroke={COLORS.ink}
            strokeWidth={4}
          />
          <g transform={`translate(${toX(0)} ${TRACK}) scale(${s})`}>
            <g stroke={COLORS.ink} strokeWidth={2} vectorEffect="non-scaling-stroke" opacity={trackW}>
              {ticks}
            </g>
            {/* transitions between states */}
            {nodes.slice(0, -1).map((n, i) => (
              <path
                key={i}
                d={`M ${n.wx + 40} 44 Q ${n.wx + STEP / 2} ${i === ERR - 1 || i === ERR ? 96 : 84} ${n.wx + STEP - 40} 44`}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={i === ERR - 1 && f >= ERR_AT && f < FIX_AT + 10 ? 3.5 : 2}
                strokeDasharray={i === ERR - 1 && f < FIX_AT + 10 ? '6 6' : undefined}
                vectorEffect="non-scaling-stroke"
                opacity={nodes[i + 1].appear}
              />
            ))}
            {nodes.map((n, i) => (
              <g key={i} opacity={n.appear} transform={`translate(0 ${(1 - n.appear) * 30})`}>
                <Massing
                  cx={n.wx}
                  baseY={-16}
                  params={NODE}
                  skew={n.skew}
                  missing={[2, 3, 4]}
                  missingP={n.missingP}
                  widthMul={(k) => (k === 4 ? n.topW : 1)}
                />
                {n.isErr && errP > 0 && f < FIX_AT + 18 ? (
                  <g opacity={errP * (1 - prog(f, FIX_AT + 6, 10))} transform={`translate(${n.wx} -16) skewX(${n.skew}) translate(${-n.wx} 16)`}>
                    {[2, 3, 4].map((k) =>
                      [-0.33, -0.11, 0.11, 0.33].map((q, j) => (
                        <rect
                          key={`${k}-${j}`}
                          x={n.wx + q * NODE.barW - 6}
                          y={-16 - (k + 1) * NODE.barH - k * NODE.gap + NODE.barH / 2 - 6}
                          width={12}
                          height={12}
                          fill="none"
                          stroke={COLORS.highlight}
                          strokeWidth={1.6}
                          strokeDasharray="3 2"
                        />
                      )),
                    )}
                    <rect
                      x={n.wx - NODE.barW / 2 - 10}
                      y={-16 - NODE_H - 10}
                      width={NODE.barW + 20}
                      height={NODE_H + 20}
                      fill="none"
                      stroke={COLORS.ink}
                      strokeWidth={2.5}
                      strokeDasharray="7 5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={n.wx + (NODE.barW * n.topW) / 2}
                      y={-16 - NODE_H}
                      width={(NODE.barW * (1 - n.topW)) / 2}
                      height={NODE.barH}
                      fill="url(#s5hatch)"
                      stroke={COLORS.ink}
                      strokeWidth={1.5}
                    />
                    <rect
                      x={n.wx - NODE.barW / 2}
                      y={-16 - NODE_H}
                      width={(NODE.barW * (1 - n.topW)) / 2}
                      height={NODE.barH}
                      fill="url(#s5hatch)"
                      stroke={COLORS.ink}
                      strokeWidth={1.5}
                    />
                  </g>
                ) : null}
                <CheckBadge x={n.wx + NODE.barW / 2 + 18} y={-16 - NODE_H - 20} r={16} p={n.isErr ? prog(f, FIX_AT + 10, 10) : n.check} />
              </g>
            ))}
          </g>
        </g>

        {/* error ring pulse on the faulty transition */}
        {errP > 0 && f < FIX_AT + 6 ? (
          <circle
            cx={toX(ERR * STEP)}
            cy={TRACK - (NODE_H / 2 + 16) * s}
            r={(NODE_H * 0.8 + 30 * Math.sin(errP * Math.PI)) * s}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={3}
            opacity={(1 - errP) * 0.9}
          />
        ) : null}
      </Svg>

      {/* the review indicator */}
      {phOn > 0 && f < OUT + 4 ? (
        <>
          <Band left={phX - 13} top={TRACK - PH_H * phOn} width={26} height={PH_H * phOn} core={1} coreVertical radius={5} />
          <div
            style={{
              position: 'absolute',
              left: phX - 13,
              top: TRACK - PH_H * phOn - 13,
              width: 26,
              height: 26,
              background: COLORS.ink,
              transform: 'rotate(45deg)',
              borderRadius: 3,
            }}
          />
        </>
      ) : null}
      {/* incoming tick from Scene 04 grows into the indicator */}
      {f < 56 ? <Band left={540 - 11} top={TRACK - 130 * (1 - prog(f, 30, 16, EASE.in))} width={22} height={130 * (1 - prog(f, 30, 16, EASE.in))} core={1} coreVertical radius={4} /> : null}
      {f >= OUT + 4 ? (
        <Band left={hb.cx - hb.w / 2} top={hb.cy - hb.h / 2} width={hb.w} height={hb.h} rotate={hb.rot} core={1} radius={8} />
      ) : null}

      <ArLine text={COPY.s5.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={14} stagger={4} mode="rise" outAt={OUT} outMode="rise" />
      {COPY.s5.support.map((t, i) => (
        <ArLine key={i} text={t} x={TEXT_RIGHT} y={SUP.y + i * 68} size={SUP.size} weight={500} inAt={64 + i * 10} inDur={18} mode="wipe" outAt={OUT - 2 + i * 2} outMode="fade" />
      ))}
      <ArLine
        text={COPY.s5.line2}
        x={TEXT_RIGHT}
        y={L2.y}
        size={L2.size}
        inAt={106}
        inDur={16}
        stagger={4}
        mode="rise"
        hl={{at: 114, dur: 12, outAt: OUT + 2, outDur: 10}}
        outAt={OUT + 2}
        outMode="rise"
      />

      <Sfx at={2} name="pop" volume={0.6} />
      <Sfx at={40} name="tick" />
      <Sfx at={44} name="tick" rate={1.15} />
      <Sfx at={60} name="click" volume={0.6} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} at={60 + i * 10} name="click" volume={0.5} rate={1 + i * 0.05} />
      ))}
      <Sfx at={ERR_AT} name="thud" volume={0.8} />
      <Sfx at={ERR_AT + 4} name="error" />
      <Sfx at={FIX_AT} name="align" />
      <Sfx at={FIX_AT + 10} name="resolve" volume={0.6} />
      <Sfx at={RESUME} name="click" volume={0.6} rate={1.2} />
      <Sfx at={114} name="sweep" volume={0.6} />
      <Sfx at={OUT + 4} name="swoosh" volume={0.5} />
    </AbsoluteFill>
  );
};
