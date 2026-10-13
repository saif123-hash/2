import {loadFont} from '@remotion/fonts';
import opentype from 'opentype.js';
import {staticFile} from 'remotion';
import {FONT_FAMILY} from '../config/theme';

const FILES: [string, string][] = [
  ['300', 'thmanyahsans-Light.woff2'],
  ['400', 'thmanyahsans-Regular.woff2'],
  ['500', 'thmanyahsans-Medium.woff2'],
  ['700', 'thmanyahsans-Bold.woff2'],
  ['900', 'thmanyahsans-Black.woff2'],
];

let promise: Promise<void> | null = null;
let outlineFont: opentype.Font | null = null;

/** Parsed Thmanyah Sans Black outlines (for extruded 3D digits). */
export const getOutlineFont = () => {
  if (!outlineFont) throw new Error('Outline font not loaded yet');
  return outlineFont;
};

export const loadBrandFonts = () => {
  if (!promise) {
    const faces = Promise.all(
      FILES.map(([weight, file]) =>
        loadFont({family: FONT_FAMILY, url: staticFile(`fonts/${file}`), weight, display: 'block'}),
      ),
    );
    const outlines = fetch(staticFile('fonts/thmanyahsans-Black.otf'))
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        outlineFont = opentype.parse(buf);
      });
    promise = Promise.all([faces, outlines]).then(() => undefined);
  }
  return promise;
};
