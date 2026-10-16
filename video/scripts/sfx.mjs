// Generates the sound effects with the ElevenLabs Sound Effects API:
//
//   ELEVENLABS_API_KEY=... pnpm sfx [name ...]
//
// sfx/sounds.json lists each sound's prompt and length. Every run spends
// credits and gives a different take, so pass names to redo only some. Raw
// takes go to sfx/raw/; `pnpm sfx:prep` trims and splits them into
// public/sfx/, which the render uses.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('Set ELEVENLABS_API_KEY to an ElevenLabs API key.');
  process.exit(1);
}
const only = process.argv.slice(2);
const sounds = JSON.parse(readFileSync(join(root, 'sfx/sounds.json'), 'utf8')).filter(s => !only.length || only.includes(s.name));
mkdirSync(join(root, 'sfx/raw'), { recursive: true });

for (const { name, ...body } of sounds) {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    console.error(`${name}: ElevenLabs returned ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const out = join(root, 'sfx/raw', name + '.mp3');
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log('Saved', out);
}
