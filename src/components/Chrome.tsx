import React from 'react';
import {useCurrentFrame} from 'remotion';
import {BRAND} from '../config/copy';
import {COLORS, FONT_FAMILY} from '../config/theme';
import {SCENE_ORDER, SCENE_START, SCENE_DURATIONS} from '../config/timeline';
import {EASE, prog, tween} from '../lib/motion';

/**
 * Persistent editorial frame from the print series: scene counter top-right
 * (its digit rolls on every cut) and the handle in the footer.
 */
export const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const last = SCENE_ORDER[SCENE_ORDER.length - 1];
  const fadeOut = 1 - prog(frame, SCENE_START[last] + 138, 16, EASE.inOut);
  const intro = prog(frame, 4, 20, EASE.out);
  const op = intro * fadeOut;
  if (op <= 0) return null;

  let idx = 0;
  SCENE_ORDER.forEach((id, i) => {
    if (frame >= SCENE_START[id]) idx = i;
  });
  const sinceCut = frame - SCENE_START[SCENE_ORDER[idx]];
  const roll = idx === 0 ? 1 : prog(frame, SCENE_START[SCENE_ORDER[idx]], 12, EASE.out);
  const lineGrow = tween(sinceCut, 0, 16, 0.35, 1, EASE.out);

  const label: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontWeight: 500,
    fontSize: 30,
    letterSpacing: '0.08em',
    color: COLORS.ink,
    fontVariantNumeric: 'tabular-nums',
  };
  const digit = (n: number) => `0${n}`;
  const total = `0${SCENE_ORDER.length}`;
  // progress hairline across the scene length
  const sceneP = tween(sinceCut, 0, SCENE_DURATIONS[SCENE_ORDER[idx]], 0, 1, EASE.linear);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 92, right: 84, display: 'flex', alignItems: 'center', gap: 26, direction: 'ltr'}}>
        <div style={{...label, display: 'flex', alignItems: 'center'}}>
          <span style={{display: 'inline-block', height: 38, overflow: 'hidden', position: 'relative', width: 40}}>
            {idx > 0 ? (
              <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${-roll * 100}%)`}}>{digit(idx)}</span>
            ) : null}
            <span style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${(1 - roll) * 100}%)`}}>{digit(idx + 1)}</span>
          </span>
          <span style={{margin: '0 8px', opacity: 0.6}}>/</span>
          <span>{total}</span>
        </div>
        <div style={{width: 64, height: 3, background: COLORS.inkFaint, position: 'relative'}}>
          <div style={{position: 'absolute', inset: 0, background: COLORS.ink, transformOrigin: 'left', transform: `scaleX(${lineGrow * (0.25 + 0.75 * sceneP)})`}} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 104,
          left: 84,
          right: 84,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          direction: 'ltr',
        }}
      >
        <div style={{width: 72, height: 3, background: COLORS.ink}} />
        <div style={{...label, fontSize: 26, fontWeight: 700, letterSpacing: '0.26em'}}>{BRAND.handle}</div>
        <div style={{width: 72, height: 3, background: COLORS.ink}} />
      </div>
    </div>
  );
};
