import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COPY} from '../config/copy';
import {TEXT_RIGHT} from '../config/theme';
import {EASE, lerp, prog, tween} from '../lib/motion';
import {Panel, Sfx} from '../overlay/Overlays';
import {Beam, Check3D, EnvelopeBox} from '../three/Helpers';
import {APPROVED_3D, Massing3D, WRONG_3D, height3D, mix3D} from '../three/Massing3D';
import {Stage} from '../three/Stage';
import {Line3D} from '../three/Text3D';
import {Shot, shotTrack} from '../three/shot';

// ── Scene 02 · The original reference ─────────────────────────────────
// The flood of blue collapses into a datum beam; the approved composition
// rises on it. Two identical outputs rise behind — both wrong. Floors,
// proportions and façade rhythm are checked in 3D, the outputs morph onto
// the approved form, and the camera cranes up to a top-down view.

const A: [number, number, number] = [-2.5, 0, -5.4];
const B: [number, number, number] = [2.5, 0, -5.4];
const BEATS = [52, 70, 88];
const FIX = {at: 104, dur: 16};
const CRANE = 120;
const END = 144;
const L1 = {y: 300, size: 104};
const L2 = {y: 448, size: 124};
const LABEL_Y = [1430, 1512, 1594];

const BASE: Shot = {tx: 0, ty: 0.05, tz: 0, dist: 15, yaw: 0, pitch: 0.5, roll: 0, fov: 30};

export const S2Reference: React.FC = () => {
  const f = useCurrentFrame();

  const shot = shotTrack(f, BASE, [
    [0, {}],
    [10, {ty: 0.05, pitch: 0.5}],
    [40, {tx: 0, ty: 1.7, tz: -2.7, dist: 34, yaw: -24, pitch: 17, fov: 30}, EASE.inOut],
    [BEATS[0] + 4, {tx: -0.8, tz: -3.2, dist: 31, yaw: -30, pitch: 14}, EASE.inOut],
    [BEATS[1] + 4, {tx: 0.2, tz: -2.8, dist: 33, yaw: -14, pitch: 22}, EASE.inOut],
    [BEATS[2] + 4, {tx: 0.8, tz: -3.2, dist: 31, yaw: 6, pitch: 15}, EASE.inOut],
    [FIX.at + 12, {tx: 0, ty: 1.7, tz: -2.7, dist: 33, yaw: -10, pitch: 19}, EASE.inOut],
    [END, {tx: 0, ty: 0, tz: -1.5, dist: 19, yaw: 0, pitch: 89.5, roll: 0}, EASE.inOut],
  ]);

  // the blue flood collapses into the datum line (screen space)
  const collapse = prog(f, 0, 10, EASE.out);
  const datumScreenY = 960 + 2; // camera starts level with the beam

  const rRise = (i: number) => prog(f, 8 + i * 3, 10, EASE.overshoot);
  const abRise = (i: number) => prog(f, 24 + i * 3, 10, EASE.overshoot);
  const fix = prog(f, FIX.at, FIX.dur, EASE.inOut);
  const ab = mix3D(WRONG_3D, APPROVED_3D, fix);
  const sink = prog(f, CRANE, END - CRANE, EASE.inOut);

  const beat = (i: number) => prog(f, BEATS[i], 10, EASE.out);
  const active = (i: number) => f >= BEATS[i] && f < (BEATS[i + 1] ?? FIX.at);
  const preFix = 1 - prog(f, FIX.at, 8);

  // beat 1: count floors — a pulse climbs each output, the extra one is hatched
  const countPulse = (i: number) => {
    const t = f - (BEATS[0] + i * 2);
    return t >= 0 && t < 8 ? Math.sin((t / 8) * Math.PI) : 0;
  };

  const abFx = (i: number) => ({
    dy: (1 - abRise(i)) * -0.6,
    show: abRise(i) * (1 - prog(f, CRANE + i * 1.5, 9, EASE.in)),
    look: (i >= 5 && beat(0) > 0.5 && preFix > 0.5 ? 'hatch' : 'ink') as 'hatch' | 'ink',
    sy: 1 + countPulse(i) * 0.25,
    openings: active(2) ? 0.6 + 0.4 * Math.abs(Math.sin((f - BEATS[2]) * 0.5)) : 1,
  });
  const rFx = (i: number) => ({
    dy: (1 - rRise(i)) * -0.6,
    show: rRise(i) * (1 - prog(f, CRANE + 3 + i * 1.5, 9, EASE.in)),
    sy: 1 + countPulse(i) * 0.2,
    openings: active(2) ? 0.6 + 0.4 * Math.abs(Math.sin((f - BEATS[2]) * 0.5)) : 1,
  });

  const envOp = beat(1) * (1 - prog(f, FIX.at + FIX.dur, 8)) * (1 - sink);
  const outW = 1;

  return (
    <AbsoluteFill>
      <Stage
        shot={shot}
        lightCenter={[0, 1, -2.5]}
        grid={lerp(0.07, 0.22, sink)}
        hud={
          <>
            <Line3D text={COPY.s2.line1} x={TEXT_RIGHT} y={L1.y} size={L1.size} inAt={8} stagger={4} mode="swing" outAt={CRANE + 2} outMode="flyOut" />
            <Line3D
              text={COPY.s2.line2}
              x={TEXT_RIGHT}
              y={L2.y}
              size={L2.size}
              inAt={30}
              stagger={4}
              mode="drop"
              ease={EASE.overshoot}
              hl={{at: 40, dur: 12, outAt: CRANE + 4, outDur: 8}}
              outAt={CRANE + 4}
              outMode="flyOut"
            />
            {COPY.s2.labels.map((t, i) => (
              <Line3D
                key={i}
                text={`${t}`}
                x={TEXT_RIGHT}
                y={LABEL_Y[i]}
                size={54}
                weight={700}
                depth={10}
                inAt={BEATS[i]}
                inDur={12}
                mode="flip"
                hl={{at: BEATS[i] + 9, dur: 8, outAt: i < 2 ? BEATS[i + 1] : FIX.at, outDur: 8, depth: 8}}
                outAt={CRANE - 2 + i * 2}
                outMode="flipOut"
              />
            ))}
          </>
        }
      >
        {/* datum beam under the approved composition */}
        <Beam length={lerp(40, 4.4, prog(f, 4, 14, EASE.inOut)) * (1 - sink)} position={[0, 0, 0]} width={0.4} core={1 - sink} />

        <Massing3D params={APPROVED_3D} position={[0, 0, 0]} floorFx={rFx} />
        <Check3D p={prog(f, 26, 12) * (1 - sink)} position={[1.85, height3D(APPROVED_3D) + 0.45, 1.0]} size={0.42} />

        {[A, B].map((pos, k) => (
          <group key={k}>
            <Massing3D params={ab} position={pos} floorFx={abFx} scale={outW} />
            <EnvelopeBox w={APPROVED_3D.w + 0.1} h={height3D(APPROVED_3D) + 0.05} d={APPROVED_3D.d + 0.1} position={pos} opacity={envOp} dashed />
            <Check3D p={prog(f, FIX.at + 10, 12) * (1 - sink)} position={[pos[0] + 1.9, height3D(ab) + 0.45, pos[2] + 1.0]} size={0.4} />
          </group>
        ))}
      </Stage>

      {collapse < 1 ? <Panel left={-40} top={lerp(-40, datumScreenY - 6, collapse)} width={1160} height={lerp(2000, 12, collapse)} core={collapse} radius={0} /> : null}

      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={8 + i * 3} name="tick" rate={0.9 + i * 0.06} volume={0.6} />
      ))}
      <Sfx at={24} name="pop" volume={0.6} />
      <Sfx at={40} name="sweep" volume={0.6} />
      {BEATS.map((b, i) => (
        <Sfx key={`b${i}`} at={b} name="click" rate={1 + i * 0.08} />
      ))}
      <Sfx at={BEATS[0] + 10} name="error" volume={0.45} />
      <Sfx at={FIX.at} name="align" />
      <Sfx at={CRANE} name="whoosh" volume={0.5} />
    </AbsoluteFill>
  );
};
