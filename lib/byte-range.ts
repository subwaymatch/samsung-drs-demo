/** A part of a file, from start to end (both inclusive). */
export interface ByteRange {
  start: number;
  end: number;
}

/**
 * Reads the Range header of a request for a file of `size` bytes. Returns the
 * single byte range it asks for, null to send the whole file (no header, a
 * malformed one, or several ranges), or 'unsatisfiable' when the range lies
 * outside the file.
 */
export function parseRange(header: string | null, size: number): ByteRange | 'unsatisfiable' | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || (!m[1] && !m[2])) return null;
  if (!m[1]) {
    // "bytes=-500": the last 500 bytes.
    const n = Number(m[2]);
    return n === 0 || size === 0 ? 'unsatisfiable' : { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(m[1]);
  const end = m[2] ? Number(m[2]) : Infinity;
  if (end < start) return null;
  if (start >= size) return 'unsatisfiable';
  return { start, end: Math.min(end, size - 1) };
}

/** How much copyRange reads at a time. */
const BLOCK = 1 << 20;

/**
 * Writes bytes range.start to range.end of a stream to `out`; `toEnd` says the
 * range runs to the end of the stream. Workers streams arrive in 4 KiB chunks,
 * so this reads a block at a time to skip to the start, which keeps the CPU
 * time of a seek near the end of a large file low, and then pipes the rest
 * without touching it when the range runs to the end.
 */
export async function copyRange(body: ReadableStream<Uint8Array>, { start, end }: ByteRange, toEnd: boolean, out: WritableStream<Uint8Array>) {
  let reader: ReadableStreamBYOBReader;
  try {
    reader = body.getReader({ mode: 'byob' });
  } catch {
    // Not a byte stream: go chunk by chunk.
    return sliceBody(body, { start, end }).pipeTo(out);
  }
  let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  try {
    let pos = 0;
    let buf = new ArrayBuffer(BLOCK);
    while (pos < start) {
      const got = await fill(reader, new Uint8Array(buf, 0, Math.min(BLOCK, start - pos)));
      if (!got.byteLength) throw new RangeError('The file ends before byte ' + start);
      pos += got.byteLength;
      buf = got.buffer;
    }
    if (toEnd) {
      reader.releaseLock();
      return await body.pipeTo(out);
    }
    writer = out.getWriter();
    while (pos <= end) {
      const got = await fill(reader, new Uint8Array(Math.min(BLOCK, end + 1 - pos)));
      if (!got.byteLength) throw new RangeError('The file ends before byte ' + end);
      await writer.write(got);
      pos += got.byteLength;
    }
    await writer.close();
    await reader.cancel();
  } catch (e) {
    // Fail the response and stop reading. (A failed pipe has done both already.)
    (writer ?? out).abort(e).catch(() => {});
    reader.cancel(e).catch(() => {});
    throw e;
  }
}

/** Reads into `view` until it is full or the stream ends, and returns the part filled. */
async function fill(reader: ReadableStreamBYOBReader, view: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  if (reader.readAtLeast) {
    const { value } = await reader.readAtLeast(view.byteLength, view);
    return value ?? new Uint8Array(0);
  }
  const { byteOffset, byteLength } = view;
  let buffer = view.buffer, filled = 0;
  while (filled < byteLength) {
    const { value, done } = await reader.read(new Uint8Array(buffer, byteOffset + filled, byteLength - filled));
    if (!value) break;
    buffer = value.buffer;
    filled += value.byteLength;
    if (done) break;
  }
  return new Uint8Array(buffer, byteOffset, filled);
}

/** The bytes of a stream from range.start to range.end, chunk by chunk. Chunks inside the range pass through as they are. */
export function sliceBody(body: ReadableStream<Uint8Array>, { start, end }: ByteRange): ReadableStream<Uint8Array> {
  let pos = 0;
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, out) {
        const from = pos;
        pos += chunk.byteLength;
        if (pos <= start) return;
        const a = Math.max(0, start - from), b = Math.min(chunk.byteLength, end + 1 - from);
        if (a < b) out.enqueue(a === 0 && b === chunk.byteLength ? chunk : chunk.subarray(a, b));
        // Past the end: stop, which also cancels the rest of the source.
        if (pos > end) out.terminate();
      }
    })
  );
}
