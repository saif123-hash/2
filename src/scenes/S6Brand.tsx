import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {BRAND, COPY} from '../config/copy';
import {COLORS, FONT_FAMILY} from '../config/theme';
import {EASE, lerp, prog} from '../lib/motion';
import {Panel, Sfx} from '../overlay/Overlays';
import {Beam, Check3D} from '../three/Helpers';
import {HudBrackets} from '../three/Hud';
import {APPROVED_3D, Massing3D, height3D} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D} from '../three/Text3D';
import {Shot, shotTrack} from '../three/shot';

// ── Scene 06 · Brand resolution ───────────────────────────────────────
// The approved system snaps into perfect alignment and the camera circles
// it — the framing keeps changing, the project never does. The final
// highlight is drawn behind «مش المشروع.», then the logo lock-up.

const L1 = {y: 1190, size: 124};
const L2 = {y: 1370, size: 210};
const SUP = {y: 1560, size: 48};
const L2_AT = 34;
const EXIT = 112;
const LOGO_AT = 120;
const LOGO = {w: 760, cy: 840};
const KEY_Y = L2.y;

const BASE: Shot = {tx: 0, ty: -0.3, tz: 0, dist: 26, yaw: -70, pitch: 12, roll: -5, fov: 30};

export const S6Brand: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotTrack(f, BASE, [
    [0, {}],
    [40, {yaw: -20, pitch: 22, roll: 3, dist: 24}, EASE.inOut],
    [76, {yaw: 30, pitch: 8, roll: -2, dist: 25}, EASE.inOut],
    [EXIT, {yaw: 60, pitch: 16, roll: 0, dist: 26}, EASE.inOut],
    [LOGO_AT + 8, {ty: 6, pitch: 60, dist: 30}, EASE.in],
  ]);

  // the pale flood from Scene 05 collapses into a guide line where the
  // final highlight will be drawn
  const collapse = prog(f, 0, 12, EASE.out);
  const shrink = prog(f, 12, 14, EASE.inOut);

  const snap = (i: number) => prog(f, 4 + i * 3, 12, EASE.overshoot);
  const offs = [2.2, -1.8, 1.6, -1.4, 1.2];
  const sink = prog(f, EXIT, 14, EASE.in);
  const guide = prog(f, 18, 8) * (1 - prog(f, 40, 10));

  const logoP = prog(f, LOGO_AT, 30, EASE.smooth);
  const nameP = prog(f, LOGO_AT + 18, 16, EASE.out);
  const handleP = prog(f, LOGO_AT + 26, 16, EASE.out);
  const logoH = LOGO.w / (1745 / 757);
  const brackets = [
    [150, 360, 780, 760],
    [260, 430, 560, 600],
    [120, 330, 840, 820],
    [210, 400, 660, 680],
  ];
  const bk = Math.min(3, Math.floor(f / 24));
  const bt = prog(f, bk * 24, 10, EASE.out);
  const prev = brackets[Math.max(0, bk - 1)];
  const cur = brackets[bk];
  const br = cur.map((v, i) => lerp(prev[i], v, bt));

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[0, 1, 0]}
        hud={
          <>
            <Line3D text={COPY.s6.line1} x={540} y={L1.y} align="center" size={L1.size} inAt={10} inDur={18} stagger={6} mode="spin" outAt={EXIT} outMode="flyOut" />
            <Line3D
              text={COPY.s6.line2}
              x={540}
              y={L2.y}
              align="center"
              size={L2.size}
              inAt={L2_AT}
              inDur={14}
              stagger={4}
              mode="slam"
              hl={{at: L2_AT + 8, dur: 12, outAt: EXIT + 2, outDur: 10}}
              outAt={EXIT + 2}
              outMode="flyOut"
            />
            {COPY.s6.support.map((t, i) => (
              <Line3D key={i} text={t} x={540} y={SUP.y + i * 64} align="center" size={SUP.size} weight={500} depth={6} inAt={60 + i * 6} stagger={2} mode="rise" outAt={EXIT - 4} outMode="flipOut" />
            ))}
            <HudBrackets x={br[0]} y={br[1]} w={br[2]} h={br[3]} opacity={prog(f, 6, 8) * (1 - prog(f, EXIT - 6, 8))} />
          </>
        }
      >
        <Massing3D
          params={APPROVED_3D}
          floorFx={(i) => ({dx: offs[i] * (1 - snap(i)), show: Math.min(1, snap(i) * 3) * (1 - prog(f, EXIT + i * 1.5, 10, EASE.in))})}
        />
        {guide > 0 ? (
          <>
            <Beam length={0.04} position={[APPROVED_3D.w / 2 + 0.06, 0, 0]} />
            {[-1, 1].map((s) => (
              <mesh key={s} position={[(s * APPROVED_3D.w) / 2 + s * 0.04, height3D(APPROVED_3D) / 2 + 0.3, APPROVED_3D.d / 2 + 0.05]} scale={[1, guide, 1]}>
                <boxGeometry args={[0.03, height3D(APPROVED_3D) + 1.2, 0.03]} />
                <meshBasicMaterial color={COLORS.highlight} />
              </mesh>
            ))}
          </>
        ) : null}
        <Check3D p={prog(f, 26, 10) * (1 - sink)} position={[APPROVED_3D.w / 2 + 0.3, height3D(APPROVED_3D) + 0.6, APPROVED_3D.d / 2]} size={0.45} yaw={-10} />
      </Stage>

      {collapse < 1 || shrink < 1 ? (
        <Panel
          left={lerp(-40, -40 + 600 * shrink, 1)}
          top={lerp(-40, KEY_Y - 7, collapse)}
          width={lerp(1160, 0, shrink)}
          height={lerp(2000, 14, collapse)}
          core={collapse}
          radius={0}
        />
      ) : null}

      {/* logo lock-up: the original artwork, revealed right→left, settling from a 3D tilt */}
      {logoP > 0 ? (
        <div style={{position: 'absolute', inset: 0, perspective: 1400}}>
          <Img
            src={staticFile('brand/archsaif-logo.png')}
            style={{
              position: 'absolute',
              left: 540 - LOGO.w / 2,
              top: LOGO.cy - logoH / 2,
              width: LOGO.w,
              height: logoH,
              transform: `rotateY(${(1 - logoP) * -38}deg) rotateX(${(1 - logoP) * 12}deg) scale(${lerp(1.15, 1, logoP)})`,
              WebkitMaskImage: `linear-gradient(to left, #000 ${logoP * 130 - 30}%, transparent ${logoP * 130}%)`,
              maskImage: `linear-gradient(to left, #000 ${logoP * 130 - 30}%, transparent ${logoP * 130}%)`,
            }}
          />
        </div>
      ) : null}
      {logoP > 0.5 ? (
        <Panel left={540 - 55 * prog(f, LOGO_AT + 14, 12, EASE.out)} top={1066} width={110 * prog(f, LOGO_AT + 14, 12, EASE.out)} height={8} core={1} radius={4} />
      ) : null}
      {nameP > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 1098,
            textAlign: 'center',
            fontFamily: FONT_FAMILY,
            fontWeight: 700,
            fontSize: 74,
            color: COLORS.ink,
            direction: 'ltr',
            opacity: nameP,
            transform: `translateY(${(1 - nameP) * 30}px)`,
          }}
        >
          {BRAND.name}
        </div>
      ) : null}
      {handleP > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1214, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, direction: 'ltr'}}>
          <div style={{width: 64 * handleP, height: 3, background: COLORS.ink}} />
          <div style={{fontFamily: FONT_FAMILY, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em', marginRight: '-0.3em', color: COLORS.ink, opacity: handleP}}>{BRAND.handle}</div>
          <div style={{width: 64 * handleP, height: 3, background: COLORS.ink}} />
        </div>
      ) : null}

      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={4 + i * 3 + 8} name="tick" volume={0.45} rate={1.2 + i * 0.04} />
      ))}
      <Sfx at={10} name="swoosh" volume={0.5} />
      <Sfx at={L2_AT + 6} name="slam" volume={0.65} />
      <Sfx at={L2_AT + 8} name="sweep" volume={0.6} />
      <Sfx at={24} name="click" />
      <Sfx at={48} name="click" rate={1.1} />
      <Sfx at={72} name="click" rate={1.2} />
      <Sfx at={EXIT} name="whoosh" volume={0.45} />
      <Sfx at={LOGO_AT} name="resolve" />
    </AbsoluteFill>
  );
};
