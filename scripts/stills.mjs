// Render a set of frames to PNG (one bundle, many stills) for visual QA.
// usage: node scripts/stills.mjs <outDir> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id: 'ArchSaifFilm', browserExecutable, chromiumOptions: {gl: 'swangle'}});
for (const fr of frames.map(Number)) {
  await renderStill({
    serveUrl,
    composition,
    frame: fr,
    output: path.join(outDir, `f${String(fr).padStart(4, '0')}.png`),
    browserExecutable,
    scale: 0.5,
    chromiumOptions: {gl: 'swangle'},
  });
  process.stdout.write(`${fr} `);
}
console.log('done');
