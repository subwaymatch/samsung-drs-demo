// Range requests for /stream, which lets the About page's video seek.

import { describe, expect, it } from 'vitest';
import { copyRange, parseRange, sliceBody } from '@/lib/byte-range';

const SIZE = 3_000_000;
const file = Uint8Array.from({ length: SIZE }, (_, i) => (i * 7 + (i >> 11)) & 255);

/** The file as a stream of uneven chunks; a byte stream supports the block reads copyRange uses. */
function stream(bytes: boolean) {
  let pos = 0, n = 0;
  const next = () => {
    const len = [4096, 1, 65536, 777][n++ % 4];
    const chunk = file.slice(pos, pos + len);
    pos += chunk.length;
    return chunk;
  };
  return bytes
    ? new ReadableStream({
        type: 'bytes',
        pull(c) {
          if (pos >= SIZE) return c.close();
          c.enqueue(next());
        }
      })
    : new ReadableStream<Uint8Array>({
        pull(c) {
          if (pos >= SIZE) return c.close();
          c.enqueue(next());
        }
      });
}

async function collect(s: ReadableStream<Uint8Array>) {
  const out = new Uint8Array(await new Response(s).arrayBuffer());
  return out;
}

describe('parseRange', () => {
  it.each([
    ['bytes=0-', { start: 0, end: 999 }],
    ['bytes=0-1', { start: 0, end: 1 }],
    ['bytes=100-199', { start: 100, end: 199 }],
    ['bytes=900-5000', { start: 900, end: 999 }],
    ['bytes=-100', { start: 900, end: 999 }],
    ['bytes=-5000', { start: 0, end: 999 }],
    [' bytes=5-9 ', { start: 5, end: 9 }]
  ])('reads %s', (h, r) => expect(parseRange(h, 1000)).toEqual(r));
  it.each(['bytes=1000-', 'bytes=5000-6000', 'bytes=-0'])('rejects %s', h => expect(parseRange(h, 1000)).toBe('unsatisfiable'));
  it.each([null, '', 'bytes=', 'bytes=-', 'bytes=9-5', 'bytes=0-1,5-6', 'items=0-5', 'bytes=a-b'])('sends the whole file for %s', h =>
    expect(parseRange(h, 1000)).toBeNull()
  );
});

const ranges: [number, number][] = [
  [0, 0],
  [0, 4095],
  [4096, 4096],
  [1_048_575, 1_048_576],
  [1_048_576, 2_200_000],
  [2_999_999, 2_999_999],
  [123_456, SIZE - 1],
  [2_500_000, SIZE - 1]
];

describe.each([
  ['block by block', true],
  ['chunk by chunk', false]
])('copyRange, %s', (_, bytes) => {
  it.each(ranges)('copies bytes %i to %i', async (start, end) => {
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const [got] = await Promise.all([collect(readable), copyRange(stream(bytes), { start, end }, end === SIZE - 1, writable)]);
    expect(got.length).toBe(end - start + 1);
    expect(Buffer.from(got).equals(Buffer.from(file.subarray(start, end + 1)))).toBe(true);
  });
});

describe('sliceBody', () => {
  it.each(ranges)('slices bytes %i to %i', async (start, end) => {
    const got = await collect(sliceBody(stream(false), { start, end }));
    expect(Buffer.from(got).equals(Buffer.from(file.subarray(start, end + 1)))).toBe(true);
  });
});
