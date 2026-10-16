// Renders stills for review: node scripts/stills.mjs Scene-intro:20,90 DrsShowcase:600
// Pass --scale=1 for full resolution (default 0.5). Writes to out/stills/.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scale = Number((args.find(a => a.startsWith('--scale=')) || '--scale=0.5').split('=')[1]);
const jobs = args.filter(a => !a.startsWith('--')).map(a => {
  const [id, frames] = a.split(':');
  return { id, frames: frames.split(',').map(Number) };
});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts'), publicDir: join(root, 'public') });
mkdirSync(join(root, 'out/stills'), { recursive: true });
for (const { id, frames } of jobs) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  for (const frame of frames) {
    const output = join(root, 'out/stills', `${id}-${frame}.png`);
    await renderStill({ serveUrl, composition, frame, output, scale, browserExecutable });
    console.log(output);
  }
}
