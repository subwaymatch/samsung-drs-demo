// Types for the parts of the Workers runtime the Worker entry uses.

interface Env {
  /** Static assets (dist/client), from wrangler.jsonc. */
  ASSETS: { fetch(input: Request | string): Promise<Response> };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

/** A pass-through stream that sends a Content-Length and checks that exactly that many bytes go through. */
declare class FixedLengthStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(expectedLength: number);
}

interface ReadableStreamBYOBReader {
  /** Workers only: fills the view with at least minBytes, unless the stream ends first. */
  readAtLeast?<T extends ArrayBufferView>(minBytes: number, view: T): Promise<ReadableStreamReadResult<T>>;
}

/** The vinext app (vinext/server/fetch-handler). */
declare module 'virtual:vinext-worker-entry' {
  const app: { fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> };
  export default app;
}

/** File name to size in bytes for public/video, from vite.config.ts. */
declare module 'virtual:video-sizes' {
  const sizes: Record<string, number>;
  export default sizes;
}
