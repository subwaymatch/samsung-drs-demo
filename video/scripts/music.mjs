// Generates the soundtrack with the ElevenLabs Music API:
//
//   ELEVENLABS_API_KEY=... pnpm music
//
// music/compose.json is the request body: a composition plan whose chunks match
// the scene cue points (see README.md), so section changes land on the cuts.
// Every run spends credits and produces a different take. The result is saved
// to public/music/drs-theme.mp3, which the render uses.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('Set ELEVENLABS_API_KEY to an ElevenLabs API key.');
  process.exit(1);
}
const out = process.argv[2] || join(root, 'public/music/drs-theme.mp3');
const body = readFileSync(join(root, 'music/compose.json'), 'utf8');

const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192', {
  method: 'POST',
  headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
  body
});
if (!res.ok) {
  console.error(`ElevenLabs returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
const ids = [...res.headers].filter(([k]) => /song|id/i.test(k)).map(([k, v]) => `${k}: ${v}`);
console.log(`Saved ${out}`);
if (ids.length) console.log(ids.join('\n'));
