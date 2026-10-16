// Turns the raw ElevenLabs takes in sfx/raw/ into the sounds the render uses,
// in public/sfx/: WAV, so there is no MP3 encoder padding to throw off the
// sync. A sound with "cuts" in sfx/sounds.json is cut into named pieces (the
// first click of the click take, single keys from the typing take); the others
// are used whole. Each piece is normalized to a -3 dBFS peak, with a 3 ms fade
// in and a short fade out; the render sets the actual levels. Clicks and keys
// have "drive_db": they are pushed into a soft clip by that much, which makes a
// short transient louder without going over full scale.
//
//   pnpm sfx:prep
//
// Remotion's ffmpeg only decodes and trims here; the fades and gain are done
// on the samples, since its build has no fade filter.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/sfx');
const RATE = 48000;
mkdirSync(out, { recursive: true });

/** Mono 16-bit samples of src, optionally cut to [from, to] seconds. */
const decode = (src, cut) => {
  const af = cut ? ['-af', `atrim=${cut[0]}:${cut[1]},asetpts=PTS-STARTPTS`] : [];
  const buf = execFileSync('npx', ['remotion', 'ffmpeg', '-v', 'error', '-i', src, ...af, '-ac', '1', '-ar', String(RATE), '-c:a', 'pcm_s16le', '-f', 'wav', 'pipe:1'], { cwd: root, maxBuffer: 64 << 20 });
  // Skip the WAV header: samples start after the "data" chunk id and its size.
  // (Streamed WAV leaves the size unset, so read to the end of the buffer.)
  const at = buf.indexOf('data') + 8;
  const pcm = Buffer.from(buf.subarray(at, at + ((buf.length - at) & ~1)));
  return new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1);
};

const wav = samples => {
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};

for (const s of JSON.parse(readFileSync(join(root, 'sfx/sounds.json'), 'utf8'))) {
  const src = join(root, 'sfx/raw', s.name + '.mp3');
  for (const [name, cut] of s.cuts ? Object.entries(s.cuts) : [[s.name, null]]) {
    const x = decode(src, cut);
    const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 1);
    const gain = (32767 * 10 ** (-3 / 20)) / peak;
    const drive = 10 ** ((s.drive_db || 0) / 20);
    // tanh(drive * v) / tanh(drive) keeps the peak where it was and lifts the rest.
    const shape = v => (drive > 1 ? Math.tanh(drive * v) / Math.tanh(drive) : v);
    const fadeIn = Math.round(RATE * 0.003), fadeOut = Math.round(Math.min(0.25, (x.length / RATE) * 0.3) * RATE);
    const y = new Int16Array(x.length);
    const top = 32767 * 10 ** (-3 / 20);
    for (let i = 0; i < x.length; i++) {
      const env = Math.min(1, i / fadeIn, (x.length - 1 - i) / fadeOut);
      y[i] = Math.round(shape((x[i] * gain) / top) * top * env);
    }
    writeFileSync(join(out, name + '.wav'), wav(y));
    console.log(`${name}.wav  ${(x.length / RATE).toFixed(2)} s, ${(20 * Math.log10(gain)).toFixed(1)} dB`);
  }
}
