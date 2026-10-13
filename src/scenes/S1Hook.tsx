import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ArLine, highlightRect} from '../components/ArLine';
import {HatchDefs} from '../components/Marks';
import {Band, Camera, Sfx, Svg} from '../components/Primitives';
import {COPY} from '../config/copy';
import {COLORS, FONT_FAMILY, TEXT_RIGHT, VIDEO} from '../config/theme';
import {HANDOFF} from '../config/timeline';
import {EASE, Key, lerp, prog, shake, track, tween} from '../lib/motion';

// ── Scene 01 · The hook ────────────────────────────────────────────────
// A massive 5 → five strips assemble (floors) → a sixth strip drops in
// uninvited → the digit rolls to 6 and takes over → the highlight behind
// the question stretches into the reference line of Scene 02.

const STACK = {cx: 770, w: 380, h: 52, gap: 18, baseY: 985};
const stripTop = (i: number) => STACK.baseY - (i + 1) * STACK.h - i * STACK.gap;
const LAND = [24, 30, 36, 42, 48];
const SIXTH = {from: 76, land: 88};
const ROLL = {at: 92, dur: 14};
const L1 = {y: 1120, size: 112};
const L2 = {y: 1262, size: 124};
const SUP = {y: 1488, size: 46, at: 130};
const OUT = 174;
const HANDOFF_AT = 188;
const END = 205;

const DIGIT_FONT = 1400;

export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();

  // ── virtual camera: slow push while holding, jolt on the uninvited strip
  const camScale = track(f, [
    [0, 1.0],
    [78, 1.035, EASE.smooth],
    [88, 1.05, EASE.in],
    [100, 1.0, EASE.out],
    [170, 1.015, EASE.smooth],
  ]);
  const jx = shake(f, SIXTH.land, 9, 12);
  const jy = shake(f + 3, SIXTH.land, 12, 12);

  // ── the digit: full-frame punch → slot beside the stack → grows as 6
  const dKeys = {
    s: [
      [0, 0.98],
      [10, 0.86, EASE.out],
      [34, 0.43, EASE.inOut],
      [104, 0.43],
      [128, 0.6, EASE.out],
    ] as Key[],
    x: [
      [10, 540],
      [34, 292, EASE.inOut],
      [104, 292],
      [128, 300, EASE.out],
    ] as Key[],
    y: [
      [10, 930],
      [34, 760, EASE.inOut],
      [104, 760],
      [128, 735, EASE.out],
    ] as Key[],
  };
  const pulse5 = Math.sin(Math.min(Math.max(f - LAND[4], 0), 10) / 10 * Math.PI) * 0.05;
  const dScale = track(f, dKeys.s) * (1 + pulse5);
  const dIntroOp = tween(f, 0, 6, 0.35, 1, EASE.out);
  const dBlur = tween(f, 0, 9, 18, 0, EASE.out);
  const roll = prog(f, ROLL.at, ROLL.dur, EASE.inOut);
  const dExit = prog(f, OUT, 16, EASE.in);

  // ── stack transforms (squash on impact, make room while the 6 grows)
  const squash = f >= SIXTH.land ? Math.sin((f - SIXTH.land) * 0.9) * 0.06 * Math.exp(-(f - SIXTH.land) * 0.22) : 0;
  const stackShift = tween(f, 104, 128, 0, 22, EASE.out);
  const stackScale = tween(f, 104, 128, 1, 0.94, EASE.out);

  const strip = (i: number) => {
    const p = prog(f, LAND[i] - 12, 12, EASE.out);
    if (p <= 0) return null;
    const dir = i % 2 === 0 ? 1 : -1;
    const x = STACK.cx - STACK.w / 2 + (1 - p) * 900 * dir;
    const smear = 1 + (1 - p) * 0.7;
    const exit = prog(f, OUT + (5 - i) * 2, 11, EASE.in);
    const y = stripTop(i);
    return (
      <g key={i} transform={`translate(${STACK.cx} ${y + STACK.h / 2}) scale(${smear * (1 - exit)} 1) translate(${-STACK.cx} ${-(y + STACK.h / 2)})`}>
        <rect x={x} y={y} width={STACK.w} height={STACK.h} rx={6} fill={COLORS.ink} />
        <text
          x={x + STACK.w - 22}
          y={y + STACK.h / 2 + 9}
          textAnchor="end"
          fontFamily={FONT_FAMILY}
          fontWeight={700}
          fontSize={24}
          fill={COLORS.bg}
          letterSpacing={2}
          opacity={prog(f, LAND[i], 8)}
        >
          {`0${i + 1}`}
        </text>
      </g>
    );
  };

  // sixth strip: accelerating drop, lands on top of the five
  const sixP = tween(f, SIXTH.from, SIXTH.land, 0, 1, EASE.in);
  const sixY = lerp(-180, stripTop(5), sixP);
  const sixExit = prog(f, OUT, 11, EASE.in);

  // dimension bracket on the right of the stack
  const bx = STACK.cx + STACK.w / 2 + 34;
  const built = LAND.reduce((a, l) => a + prog(f, l - 4, 8, EASE.out), 0);
  const bracketTop = STACK.baseY - built * (STACK.h + STACK.gap) + STACK.gap * Math.min(1, built);
  const extP = prog(f, SIXTH.land + 2, 12, EASE.out);
  const ghostP = prog(f, SIXTH.land + 2, 16, EASE.out);
  const fiveTop = stripTop(4);
  const geomExit = prog(f, OUT, 14, EASE.in);

  // ── hand-off: the highlight behind the question becomes the reference line
  const r0 = highlightRect(COPY.s1.line2, TEXT_RIGHT, L2.y, L2.size);
  const m = prog(f, HANDOFF_AT, END - HANDOFF_AT, EASE.inOut);
  const band = {
    left: lerp(r0.left, -60, m),
    top: lerp(r0.top, HANDOFF.datumY - HANDOFF.bandH / 2, m),
    width: lerp(r0.width, VIDEO.width + 120, m),
    height: lerp(r0.height, HANDOFF.bandH, m),
  };

  return (
    <AbsoluteFill>
      <Camera scale={camScale} x={jx} y={jy} pivot={[540, 900]}>
        {/* the digit */}
        <div
          style={{
            position: 'absolute',
            left: track(f, dKeys.x),
            top: track(f, dKeys.y),
            transform: `translate(-50%, -50%) scale(${dScale}) translateY(${-dExit * 12}%)`,
            fontFamily: FONT_FAMILY,
            fontWeight: 900,
            fontSize: DIGIT_FONT,
            lineHeight: 1,
            color: COLORS.ink,
            opacity: dIntroOp * (1 - dExit),
            filter: dBlur > 0.2 ? `blur(${dBlur}px)` : undefined,
          }}
        >
          <div style={{position: 'relative', overflow: 'hidden', height: '1.08em', width: '0.62em', textAlign: 'center'}}>
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${-roll * 105}%)`}}>5</div>
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - roll) * 105}%)`}}>6</div>
          </div>
        </div>

        <Svg>
          <HatchDefs id="s1hatch" spacing={11} width={2.4} />
          <g
            transform={`translate(${stackShift} 0) translate(${STACK.cx} ${STACK.baseY}) scale(${stackScale} ${stackScale * (1 - squash)}) translate(${-STACK.cx} ${-STACK.baseY})`}
          >
            {[0, 1, 2, 3, 4].map(strip)}

            {/* the uninvited sixth strip */}
            {sixP > 0 && sixExit < 1 ? (
              <g opacity={1 - sixExit}>
                <rect x={STACK.cx - STACK.w / 2} y={sixY} width={STACK.w} height={STACK.h} rx={6} fill={COLORS.highlight} stroke={COLORS.ink} strokeWidth={3} />
                <rect x={STACK.cx - STACK.w / 2} y={sixY} width={STACK.w} height={STACK.h} rx={6} fill="url(#s1hatch)" opacity={0.32} />
                <text x={STACK.cx + STACK.w / 2 - 22} y={sixY + STACK.h / 2 + 9} textAnchor="end" fontFamily={FONT_FAMILY} fontWeight={700} fontSize={24} fill={COLORS.ink} letterSpacing={2}>
                  06
                </text>
              </g>
            ) : null}

            {/* dimension bracket: solid for the approved five, dashed for the extra floor */}
            <g opacity={1 - geomExit} stroke={COLORS.ink} strokeWidth={3} strokeLinecap="round">
              {built > 0 ? (
                <>
                  <line x1={bx} y1={STACK.baseY} x2={bx} y2={bracketTop} />
                  <line x1={bx - 10} y1={STACK.baseY} x2={bx + 10} y2={STACK.baseY} />
                  <line x1={bx - 10} y1={bracketTop} x2={bx + 10} y2={bracketTop} />
                </>
              ) : null}
              {extP > 0 ? (
                <>
                  <line x1={bx} y1={fiveTop} x2={bx} y2={lerp(fiveTop, stripTop(5), extP)} strokeDasharray="8 8" />
                  <line x1={bx - 10} y1={stripTop(5)} x2={bx + 10} y2={stripTop(5)} opacity={extP} />
                </>
              ) : null}
            </g>
            {/* ghost of the approved height */}
            {ghostP > 0 ? (
              <line
                x1={STACK.cx + STACK.w / 2 + 60}
                y1={fiveTop - STACK.gap / 2}
                x2={lerp(STACK.cx + STACK.w / 2 + 60, STACK.cx - STACK.w / 2 - 40, ghostP)}
                y2={fiveTop - STACK.gap / 2}
                stroke={COLORS.ink}
                strokeWidth={2.5}
                strokeDasharray="10 9"
                opacity={1 - geomExit}
              />
            ) : null}
          </g>
        </Svg>
      </Camera>

      {/* typography sits outside the jolt so it stays crisp */}
      <ArLine text={COPY.s1.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={44} stagger={4} mode="rise" outAt={OUT + 2} outMode="rise" />
      <ArLine
        text={COPY.s1.line2}
        x={TEXT_RIGHT}
        y={L2.y}
        size={L2.size}
        inAt={100}
        inDur={16}
        stagger={4}
        mode="scale"
        outAt={178}
        outStagger={1}
        outMode="rise"
        hl={{at: 110, dur: 16, hideFrom: HANDOFF_AT}}
      />
      {COPY.s1.support.map((t, i) => (
        <ArLine key={i} text={t} x={TEXT_RIGHT} y={SUP.y + i * 66} size={SUP.size} weight={500} inAt={SUP.at + i * 8} inDur={18} mode="wipe" outAt={OUT - 4 + i * 2} outMode="fade" />
      ))}

      {f >= HANDOFF_AT ? <Band {...band} core={prog(f, 196, 9, EASE.out)} /> : null}

      {LAND.map((l, i) => (
        <Sfx key={i} at={l - 2} name="tick" rate={1 + i * 0.07} />
      ))}
      <Sfx at={0} name="thud" />
      <Sfx at={SIXTH.land} name="impact" volume={0.5} />
      <Sfx at={ROLL.at} name="click" />
      <Sfx at={110} name="sweep" />
      <Sfx at={HANDOFF_AT} name="swoosh" volume={0.45} />
    </AbsoluteFill>
  );
};
