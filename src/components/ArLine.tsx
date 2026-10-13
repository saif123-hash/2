import React from 'react';
import {useCurrentFrame} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {COLORS, FONT_FAMILY, VIDEO} from '../config/theme';
import {EASE, EaseFn, prog} from '../lib/motion';

/**
 * Kinetic Arabic line.
 * Words are animated as whole, shaped units (never split into letters), so
 * every joined letterform stays intact. Reading order (right→left) drives
 * the stagger: the first word to read is the first to move.
 */
export type InMode = 'rise' | 'drop' | 'scale' | 'wipe' | 'turn' | 'slide' | 'none';
export type OutMode = 'rise' | 'drop' | 'fade' | 'wipe' | 'none';

export type HighlightSpec = {
  at: number;
  dur?: number;
  /** frame from which the inline highlight is hidden (handed to a free shape) */
  hideFrom?: number;
  color?: string;
  /** collapse back toward the left edge */
  outAt?: number;
  outDur?: number;
};

export type ArLineProps = {
  text: string;
  x: number;
  y: number;
  align?: 'right' | 'center' | 'left';
  size: number;
  weight?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: string;
  inAt: number;
  inDur?: number;
  stagger?: number;
  mode?: InMode;
  ease?: EaseFn;
  outAt?: number;
  outDur?: number;
  outStagger?: number;
  outMode?: OutMode;
  hl?: HighlightSpec;
  /** extra transform applied to the whole line (camera-free emphasis) */
  transform?: string;
  opacity?: number;
  dir?: 'rtl' | 'ltr';
  /** the font size shrinks so the line never exceeds this width */
  maxWidth?: number;
};

const MASK_IN: InMode[] = ['rise', 'drop'];
const MASK_OUT: OutMode[] = ['rise', 'drop'];

// Highlight box geometry, in em, relative to the line box.
export const HL_BOX = {padX: 0.24, top: 0.16, bottom: 0.06};

export const MAX_W = VIDEO.width - 2 * 84;

export const measureLine = (text: string, size: number, weight = 900) =>
  measureText({text, fontFamily: FONT_FAMILY, fontSize: size, fontWeight: String(weight)}).width;

/** Screen rect of a right-aligned line's highlight (for hand-off morphs). */
/** Font size after fitting the line into maxWidth. */
export const fitSize = (text: string, size: number, weight = 900, maxWidth = MAX_W) => {
  const w = measureLine(text, size, weight);
  return w > maxWidth ? Math.floor((size * maxWidth) / w) : size;
};

export const highlightRect = (text: string, right: number, y: number, size0: number, weight = 900, lineHeight = 1.3, maxWidth = MAX_W) => {
  const size = fitSize(text, size0, weight, maxWidth);
  const w = measureLine(text, size, weight);
  const padX = HL_BOX.padX * size;
  return {
    left: right - w - padX,
    top: y + HL_BOX.top * size,
    width: w + padX * 2,
    height: size * lineHeight - (HL_BOX.top + HL_BOX.bottom) * size,
  };
};

export const ArLine: React.FC<ArLineProps> = ({
  text,
  x,
  y,
  align = 'right',
  size: size0,
  weight = 900,
  color = COLORS.ink,
  lineHeight = 1.3,
  letterSpacing,
  inAt,
  inDur = 18,
  stagger = 3,
  mode = 'rise',
  ease = EASE.out,
  outAt,
  outDur = 12,
  outStagger = 2,
  outMode = 'rise',
  hl,
  transform,
  opacity = 1,
  dir = 'rtl',
  maxWidth = MAX_W,
}) => {
  const frame = useCurrentFrame();
  const size = fitSize(text, size0, weight, maxWidth);
  const words = text.split(' ');
  const n = words.length;

  const pos: React.CSSProperties =
    align === 'right'
      ? {right: VIDEO.width - x}
      : align === 'left'
        ? {left: x}
        : {left: x, transform: 'translateX(-50%)'};

  // Whole-line wipe in/out (reveals right→left, following the reading direction)
  const wipeIn = mode === 'wipe' ? prog(frame, inAt, inDur, ease) : 1;
  const wipeOut = outAt !== undefined && outMode === 'wipe' ? prog(frame, outAt, outDur, EASE.in) : 0;
  const clip =
    mode === 'wipe' || outMode === 'wipe'
      ? `inset(-30% ${wipeOut * 100}% -45% ${(1 - wipeIn) * 100}%)`
      : undefined;

  let hlNode: React.ReactNode = null;
  if (hl && (hl.hideFrom === undefined || frame < hl.hideFrom)) {
    const p = prog(frame, hl.at, hl.dur ?? 14, EASE.inOut);
    const q = hl.outAt !== undefined ? prog(frame, hl.outAt, hl.outDur ?? 12, EASE.in) : 0;
    if (p > 0 && q < 1) {
      const pad = HL_BOX.padX;
      const drawing = p > 0.01 && p < 0.99;
      hlNode = (
        <div
          style={{
            position: 'absolute',
            left: `-${pad}em`,
            right: `-${pad}em`,
            top: `${HL_BOX.top}em`,
            bottom: `${HL_BOX.bottom}em`,
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: hl.color ?? COLORS.highlight,
              borderRadius: 0.06 * size,
              transform: `scaleX(${p * (1 - q)})`,
              transformOrigin: q > 0 ? 'left center' : 'right center',
            }}
          />
          {drawing ? (
            <div
              style={{
                position: 'absolute',
                top: '-6%',
                bottom: '-6%',
                width: Math.max(3, size * 0.035),
                left: `calc(${(1 - p) * 100}% - ${Math.max(3, size * 0.035) / 2}px)`,
                background: COLORS.ink,
                borderRadius: 4,
              }}
            />
          ) : null}
        </div>
      );
    }
  }

  return (
    <div style={{position: 'absolute', top: y, ...pos, opacity}}>
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          direction: dir,
          whiteSpace: 'nowrap',
          fontFamily: FONT_FAMILY,
          fontSize: size,
          fontWeight: weight,
          lineHeight,
          letterSpacing,
          color,
          transform,
        }}
      >
        {hlNode}
        <div style={{position: 'relative', zIndex: 1, clipPath: clip}}>
          {words.map((w, i) => {
            const p = mode === 'wipe' || mode === 'none' ? 1 : prog(frame, inAt + i * stagger, inDur, ease);
            const q =
              outAt === undefined || outMode === 'wipe' || outMode === 'none'
                ? 0
                : prog(frame, outAt + i * outStagger, outDur, EASE.in);
            const masked = (MASK_IN.includes(mode) && p < 1) || (MASK_OUT.includes(outMode) && q > 0);

            let tf = '';
            let op = 1;
            let filter: string | undefined;
            switch (mode) {
              case 'rise':
                tf += `translateY(${(1 - p) * 2.1}em) `;
                break;
              case 'drop':
                tf += `translateY(${-(1 - p) * 2.1}em) `;
                break;
              case 'scale':
                tf += `scale(${1 + (1 - p) * 0.85}) `;
                op *= Math.min(1, p * 1.6);
                filter = p < 1 ? `blur(${(1 - p) * 16}px)` : undefined;
                break;
              case 'turn':
                tf += `perspective(${size * 6}px) rotateY(${-(1 - p) * 88}deg) translateX(${(1 - p) * 0.4}em) `;
                op *= Math.min(1, p * 2);
                break;
              case 'slide':
                tf += `translateX(${(1 - p) * 0.9}em) `;
                op *= p;
                break;
              default:
                break;
            }
            switch (outMode) {
              case 'rise':
                tf += `translateY(${-q * 2.1}em) `;
                break;
              case 'drop':
                tf += `translateY(${q * 2.1}em) `;
                break;
              case 'fade':
                tf += `translateY(${-q * 0.25}em) `;
                op *= 1 - q;
                filter = q > 0 ? `blur(${q * 10}px)` : filter;
                break;
              default:
                break;
            }
            return (
              <React.Fragment key={i}>
                <span
                  style={{
                    display: 'inline-block',
                    overflow: masked ? 'hidden' : 'visible',
                    padding: '0.12em 0.06em 0.34em',
                    margin: '-0.12em -0.06em -0.34em',
                    verticalAlign: 'top',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: tf || undefined,
                      transformOrigin: mode === 'turn' ? 'right center' : 'center 60%',
                      opacity: op,
                      filter,
                    }}
                  >
                    {w}
                  </span>
                </span>
                {i < n - 1 ? ' ' : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
