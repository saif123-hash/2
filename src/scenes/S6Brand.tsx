import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {ArLine, HL_BOX, fitSize, measureLine} from '../components/ArLine';
import {Brackets, CheckBadge} from '../components/Marks';
import {APPROVED, Massing, barTop} from '../components/Massing';
import {Band, Sfx, Svg} from '../components/Primitives';
import {BRAND, COPY} from '../config/copy';
import {COLORS, FONT_FAMILY, VIDEO} from '../config/theme';
import {HANDOFF} from '../config/timeline';
import {EASE, Key, lerp, prog, track} from '../lib/motion';

// ── Scene 06 · Brand resolution ───────────────────────────────────────
// The approved system returns perfectly aligned; only the framing moves.
// The travelling band is drawn open into the final highlight behind
// «مش المشروع.», then condenses into the divider of the logo lock-up.

const CX = 540;
const BASE = 790;
const L1 = {y: 905, size: 124};
const L2_SIZE = 196;
const KEY_Y = HANDOFF.s6KeyLineY; // centre of the final highlight
const SUP = {y: 1428, size: 48};
const HL_AT = 44;
const EXIT = 142;
const LOGO_AT = 150;
const LOGO = {w: 720, cy: 830};
const DIVIDER = {y: 1046, w: 110, h: 8};

export const S6Brand: React.FC = () => {
  const f = useCurrentFrame();

  const l2Size = fitSize(COPY.s6.line2, L2_SIZE, 900);
  const lineBoxH = l2Size * 1.3;
  const l2Y = KEY_Y - (HL_BOX.top + (1.3 - HL_BOX.top - HL_BOX.bottom) / 2) * l2Size;
  const hlW = measureLine(COPY.s6.line2, l2Size, 900) + HL_BOX.padX * l2Size * 2;
  const hlH = lineBoxH - (HL_BOX.top + HL_BOX.bottom) * l2Size;

  // band: guide line → drawn open into the highlight → condensed divider
  const open = prog(f, HL_AT, 16, EASE.inOut);
  const close = prog(f, EXIT + 2, 18, EASE.inOut);
  const settle = prog(f, 0, 16, EASE.out);
  let bw = lerp(VIDEO.width + 120, lerp(VIDEO.width - 160, hlW, open), settle);
  let bh = lerp(HANDOFF.bandH, lerp(6, hlH, open), settle);
  let bcy: number = KEY_Y;
  bw = lerp(bw, DIVIDER.w, close);
  bh = lerp(bh, DIVIDER.h, close);
  bcy = lerp(bcy, DIVIDER.y, close);
  const core = Math.max(1 - prog(f, HL_AT, 6), prog(f, EXIT + 10, 10));

  // the approved system, aligning
  const offsets = [160, -140, 120, -100, 80];
  const snap = (i: number) => prog(f, 4 + i * 4, 16, EASE.out);
  const sysOut = prog(f, EXIT - 4, 16, EASE.in);
  const guideP = prog(f, 22, 12) * (1 - prog(f, 46, 12));
  const gridP = prog(f, 2, 24, EASE.inOut);

  // framing changes; the system stays put
  const fr = (k: 0 | 1 | 2 | 3) => [
    [228, 400, 624, 470],
    [330, 452, 420, 372],
    [204, 420, 640, 430],
    [282, 418, 516, 404],
  ][k];
  const frameKeys = (j: number): Key[] => [
    [6, fr(0)[j]],
    [30, fr(1)[j]],
    [52, fr(2)[j]],
    [74, fr(3)[j]],
  ];
  const brRot = track(f, [
    [6, 0],
    [30, -7],
    [52, 5],
    [74, 0],
  ]);
  const brP = prog(f, 6, 10) * (1 - sysOut);

  // logo lock-up
  const logoP = prog(f, LOGO_AT, 34, EASE.smooth);
  const nameP = prog(f, LOGO_AT + 22, 18, EASE.out);
  const handleP = prog(f, LOGO_AT + 30, 18, EASE.out);
  const logoH = LOGO.w / (1745 / 757);

  return (
    <AbsoluteFill>
      <Svg>
        <g opacity={(1 - sysOut) * gridP * 0.5} stroke={COLORS.ink} strokeWidth={1.5}>
          {Array.from({length: 11}, (_, i) => 240 + i * 60).map((x) => (
            <line key={`v${x}`} x1={x} y1={BASE - 400 * gridP} x2={x} y2={BASE + 30} opacity={0.35} />
          ))}
          {Array.from({length: 8}, (_, i) => BASE - i * 60).map((y) => (
            <line key={`h${y}`} x1={CX - 300 * gridP} y1={y} x2={CX + 300 * gridP} y2={y} opacity={0.35} />
          ))}
        </g>
        <g opacity={1 - sysOut} transform={`translate(0 ${-sysOut * 40})`}>
          <line x1={CX - 230} y1={BASE + 3} x2={CX + 230} y2={BASE + 3} stroke={COLORS.ink} strokeWidth={4} opacity={prog(f, 4, 10)} />
          <Massing cx={CX} baseY={BASE} params={APPROVED} offsetX={(i) => offsets[i] * (1 - snap(i))} build={prog(f, 2, 20, EASE.out)} />
          {guideP > 0 ? (
            <g stroke={COLORS.ink} strokeWidth={2.5} strokeDasharray="6 7" opacity={guideP}>
              <line x1={CX - 160} y1={BASE + 40} x2={CX - 160} y2={barTop(APPROVED, BASE, 4) - 50} />
              <line x1={CX + 160} y1={BASE + 40} x2={CX + 160} y2={barTop(APPROVED, BASE, 4) - 50} />
            </g>
          ) : null}
          <CheckBadge x={CX + 194} y={barTop(APPROVED, BASE, 4) - 14} r={24} p={prog(f, 30, 12)} />
          <Brackets
            x={track(f, frameKeys(0))}
            y={track(f, frameKeys(1))}
            w={track(f, frameKeys(2))}
            h={track(f, frameKeys(3))}
            rotate={brRot}
            len={50}
            sw={5}
            opacity={brP}
          />
          {/* fixed anchor: the system's centre never moves */}
          <circle cx={CX} cy={BASE - 143} r={7} fill={COLORS.highlight} stroke={COLORS.ink} strokeWidth={3} opacity={brP} />
        </g>
      </Svg>

      <Band left={CX - bw / 2} top={bcy - bh / 2} width={bw} height={bh} core={core} radius={lerp(4, 0.06 * l2Size, open)} />

      <ArLine
        text={COPY.s6.line1}
        x={CX}
        y={L1.y}
        align="center"
        size={L1.size}
        inAt={12}
        inDur={20}
        stagger={7}
        mode="turn"
        outAt={EXIT}
        outMode="rise"
      />
      <ArLine
        text={COPY.s6.line2}
        x={CX}
        y={l2Y}
        align="center"
        size={L2_SIZE}
        inAt={HL_AT + 6}
        inDur={20}
        stagger={5}
        mode="scale"
        ease={EASE.overshoot}
        outAt={EXIT}
        outStagger={2}
        outMode="rise"
      />
      {COPY.s6.support.map((t, i) => (
        <ArLine
          key={i}
          text={t}
          x={CX}
          y={SUP.y + i * 70}
          align="center"
          size={SUP.size}
          weight={500}
          inAt={78 + i * 9}
          inDur={20}
          mode="wipe"
          outAt={EXIT - 6 + i * 2}
          outMode="fade"
        />
      ))}

      {/* logo lock-up: original artwork, revealed right→left with a soft edge */}
      {logoP > 0 ? (
        <Img
          src={staticFile('brand/archsaif-logo.png')}
          style={{
            position: 'absolute',
            left: CX - LOGO.w / 2,
            top: LOGO.cy - logoH / 2,
            width: LOGO.w,
            height: logoH,
            transform: `scale(${lerp(1.05, 1, logoP)})`,
            WebkitMaskImage: `linear-gradient(to left, #000 ${logoP * 130 - 30}%, transparent ${logoP * 130}%)`,
            maskImage: `linear-gradient(to left, #000 ${logoP * 130 - 30}%, transparent ${logoP * 130}%)`,
          }}
        />
      ) : null}
      {nameP > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1088,
            textAlign: 'center',
            fontFamily: FONT_FAMILY,
            fontWeight: 700,
            fontSize: 70,
            letterSpacing: '0.01em',
            color: COLORS.ink,
            direction: 'ltr',
            opacity: nameP,
            transform: `translateY(${(1 - nameP) * 26}px)`,
          }}
        >
          {BRAND.name}
        </div>
      ) : null}
      {handleP > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 26,
            direction: 'ltr',
          }}
        >
          <div style={{width: 64 * handleP, height: 3, background: COLORS.ink}} />
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: '0.3em',
              marginRight: '-0.3em',
              color: COLORS.ink,
              opacity: handleP,
            }}
          >
            {BRAND.handle}
          </div>
          <div style={{width: 64 * handleP, height: 3, background: COLORS.ink}} />
        </div>
      ) : null}

      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={6 + i * 4} name="tick" volume={0.45} rate={1.2 + i * 0.04} />
      ))}
      <Sfx at={14} name="click" volume={0.5} rate={0.9} />
      <Sfx at={30} name="click" />
      <Sfx at={52} name="click" rate={1.1} />
      <Sfx at={HL_AT} name="sweep" />
      <Sfx at={HL_AT + 10} name="impact" volume={0.62} />
      <Sfx at={74} name="align" volume={0.7} />
      <Sfx at={EXIT + 2} name="whoosh" volume={0.3} />
      <Sfx at={LOGO_AT} name="resolve" />
    </AbsoluteFill>
  );
};
