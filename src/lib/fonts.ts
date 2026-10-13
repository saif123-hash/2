import {loadFont} from '@remotion/fonts';
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

export const loadBrandFonts = () => {
  if (!promise) {
    promise = Promise.all(
      FILES.map(([weight, file]) =>
        loadFont({family: FONT_FAMILY, url: staticFile(`fonts/${file}`), weight, display: 'block'}),
      ),
    ).then(() => undefined);
  }
  return promise;
};
