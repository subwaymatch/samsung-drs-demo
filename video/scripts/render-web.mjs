// Renders the copy of the showcase that the site serves, sized to fit under the
// 25 MiB limit for a single Cloudflare Workers static asset.
//
//   pnpm render:web [target MiB, default 24.5] [--reuse]
//
// --reuse encodes the frames and audio left in out/web by an earlier run instead
// of rendering them again, for example to try another size target.
//
// Remotion renders lossless PNG frames and a WAV of the soundtrack, then a
// two-pass x264 encode spends exactly the size budget on them. That beats
// re-encoding the master, which would compress the video a second time. The
// encode uses BT.709 limited-range color, the standard for HD video.

import { execFileSync } from 'node:child_process';
import { devNull } from 'node:os';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const TARGET_MIB = Number(args.find(a => !a.startsWith('--'))) || 24.5;
const reuse = args.includes('--reuse');
const LIMIT = 25 * 1024 * 1024;
const FPS = 30;
const AUDIO_KBPS = 192;
const work = join(root, 'out', 'web');
const output = join(root, 'out', 'drs-showcase-web.mp4');

const remotion = args => execFileSync('npx', ['remotion', ...args], { cwd: root, stdio: 'inherit' });
const ffmpeg = args => remotion(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'warning', '-stats', ...args]);

if (!reuse) {
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  remotion(['render', 'DrsShowcase', join(work, 'frames'), '--sequence', '--image-format=png']);
  remotion(['render', 'DrsShowcase', join(work, 'audio.wav'), '--codec=wav']);
}

const frames = readdirSync(join(work, 'frames')).filter(f => f.endsWith('.png')).sort();
const match = /^(.*?)(\d+)\.png$/.exec(frames[0]);
if (!match) throw new Error('Unexpected frame name: ' + frames[0]);
const pattern = join(work, 'frames', `${match[1]}%0${match[2].length}d.png`);
const seconds = frames.length / FPS;
// Leave 1.5% for the MP4 container and for two-pass overshoot.
const videoKbps = Math.floor(((TARGET_MIB * 1024 * 1024 * 8) / 1000 / seconds - AUDIO_KBPS) * 0.985);
console.log(`${frames.length} frames, ${seconds.toFixed(2)} s: video at ${videoKbps} kbps, audio at ${AUDIO_KBPS} kbps`);

const frameInput = ['-framerate', String(FPS), '-start_number', String(Number(match[2])), '-i', pattern];
const encode = [
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  // Remotion's ffmpeg leaves primaries and transfer untagged without these.
  '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709',
  '-c:v', 'libx264', '-preset', 'veryslow', '-profile:v', 'high',
  // Level 4.1 caps the reference frames that veryslow would use, so phones and
  // older hardware decoders can play it too.
  '-level:v', '4.1', '-b:v', `${videoKbps}k`,
  // A keyframe every 4 seconds keeps seeking quick in the browser.
  '-g', String(FPS * 4),
  '-passlogfile', join(work, 'x264')
];
ffmpeg([...frameInput, ...encode, '-pass', '1', '-an', '-f', 'null', devNull]);
ffmpeg([...frameInput, '-i', join(work, 'audio.wav'), '-map', '0:v', '-map', '1:a', ...encode, '-pass', '2', '-c:a', 'aac', '-b:a', `${AUDIO_KBPS}k`, '-movflags', '+faststart', output]);

const size = statSync(output).size;
console.log(`Wrote ${output}: ${(size / 1024 / 1024).toFixed(2)} MiB`);
if (size >= LIMIT) {
  throw new Error(`Over the 25 MiB static asset limit. Try a lower target: pnpm render:web ${(TARGET_MIB - 0.5).toFixed(1)} --reuse`);
}
console.log('The frames and audio stay in out/web for --reuse; delete it to free the space.');
