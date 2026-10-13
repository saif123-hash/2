// Brand palette + type system. Every scene reads from here.
export const COLORS = {
  bg: '#F5F6F8',
  ink: '#19324D',
  highlight: '#D8E5FF',
  // Derived tints of the brand ink (alpha only — no new hues).
  inkSoft: 'rgba(25, 50, 77, 0.55)',
  inkFaint: 'rgba(25, 50, 77, 0.16)',
  inkGhost: 'rgba(25, 50, 77, 0.07)',
} as const;

export const FONT_FAMILY = 'Thmanyah Sans';

export const WEIGHT = {
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

// Right edge used by right-aligned (RTL) typography.
export const MARGIN_X = 84;
export const TEXT_RIGHT = VIDEO.width - MARGIN_X;
