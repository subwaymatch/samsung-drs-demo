// The isometric illustrations listed in lib/illustrations.ts against their files in public/illustrations.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ILLUSTRATIONS, illustrationSrc, type IllustrationVariant } from '@/lib/illustrations';

const pub = (path: string) => fileURLToPath(new URL('../public' + path, import.meta.url));
const VARIANTS: IllustrationVariant[] = ['white', 'violet'];

/** Canvas size from a WebP with alpha, which Pillow writes with a VP8X header. */
function webpSize(path: string) {
  const b = readFileSync(path);
  expect(b.toString('latin1', 0, 4) + b.toString('latin1', 8, 16)).toBe('RIFFWEBPVP8X');
  return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
}

describe('illustrations', () => {
  it('has a file in each variant at the listed size', () => {
    for (const i of ILLUSTRATIONS)
      for (const v of VARIANTS) {
        const size = webpSize(pub(illustrationSrc(i.name, v)));
        expect(size, `${v} ${i.name}`).toEqual({ width: i.width, height: i.height });
      }
  });

  it('lists every file', () => {
    const names = ILLUSTRATIONS.map(i => i.name).sort();
    for (const dir of ['/illustrations', '/illustrations/violet']) {
      const files = readdirSync(pub(dir)).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -'.webp'.length));
      expect(files.sort(), dir).toEqual(names);
    }
  });
});
