// The isometric illustrations listed in lib/illustrations.ts against their files in public/illustrations.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ILLUSTRATIONS, illustrationSrc } from '@/lib/illustrations';

const pub = (path: string) => fileURLToPath(new URL('../public' + path, import.meta.url));

/** Canvas size from a WebP with alpha, which Pillow writes with a VP8X header. */
function webpSize(path: string) {
  const b = readFileSync(path);
  expect(b.toString('latin1', 0, 4) + b.toString('latin1', 8, 16)).toBe('RIFFWEBPVP8X');
  return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
}

describe('illustrations', () => {
  it('has a file at the listed size for each', () => {
    for (const i of ILLUSTRATIONS)
      expect(webpSize(pub(illustrationSrc(i.name))), i.name).toEqual({ width: i.width, height: i.height });
  });

  it('lists every file', () => {
    const files = readdirSync(pub('/illustrations'))
      .filter(f => f.endsWith('.webp'))
      .map(f => f.slice(0, -'.webp'.length));
    expect(files.sort()).toEqual(ILLUSTRATIONS.map(i => i.name).sort());
  });
});
