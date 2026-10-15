// Copies fonts and the app's mock-data images into public/ so Remotion can serve
// them with staticFile(). Everything copied here is gitignored.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, '..', 'public');
const pub = join(root, 'public');
const nm = join(root, 'node_modules');

const copy = (from, to) => {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

copy(join(nm, 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2'), join(pub, 'fonts/PretendardVariable.woff2'));
for (const w of [400, 500, 600]) {
  copy(join(nm, `@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${w}-normal.woff2`), join(pub, `fonts/JetBrainsMono-${w}.woff2`));
}
for (const dir of ['photos', 'products', 'logos', 'illustrations']) copy(join(app, dir), join(pub, dir));
copy(join(app, 'drs-logo.svg'), join(pub, 'drs-logo.svg'));
console.log('Assets copied to public/');
