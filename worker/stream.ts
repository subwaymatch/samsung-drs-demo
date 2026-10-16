import sizes from 'virtual:video-sizes';
import { copyRange, parseRange } from '../lib/byte-range';

/**
 * /stream/<file>: public/video/<file>, or the part of it the browser asks for.
 * Workers static assets send the whole file even for a Range request, and a
 * video player can only seek with partial (206) responses. The file stays a
 * static asset; this reads it from the assets binding and sends the bytes
 * asked for. It runs before the vinext app, which would pass a long response
 * through JavaScript chunk by chunk.
 */
export async function serveStream(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const file = new URL(req.url).pathname.slice('/stream/'.length);
  const size = Object.hasOwn(sizes, file) ? sizes[file] : undefined;
  const asset = size === undefined ? null : await env.ASSETS.fetch(new URL('/video/' + file, req.url).href);
  if (size === undefined || !asset?.ok || !asset.body) {
    asset?.body?.cancel();
    return new Response('Not found', { status: 404 });
  }
  const body = asset.body;

  const etag = asset.headers.get('ETag');
  const headers = new Headers({
    'Content-Type': asset.headers.get('Content-Type') || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    // Each render gets a new file name, so a file never changes.
    'Cache-Control': 'public, max-age=31536000, immutable'
  });
  if (etag) headers.set('ETag', etag);
  const empty = (status: number) => {
    body.cancel();
    return new Response(null, { status, headers });
  };
  if (etag && req.headers.get('If-None-Match') === etag) return empty(304);

  // A range of an older copy of the file (If-Range) gets the whole file instead.
  const ifRange = req.headers.get('If-Range');
  const range = ifRange && ifRange !== etag ? null : parseRange(req.headers.get('Range'), size);
  if (range === 'unsatisfiable') {
    headers.set('Content-Range', 'bytes */' + size);
    headers.set('Content-Length', '0');
    return empty(416);
  }
  const { start, end } = range ?? { start: 0, end: size - 1 };
  if (range) headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  const status = range ? 206 : 200;
  if (req.method === 'HEAD') return empty(status);

  const { readable, writable } = new FixedLengthStream(end - start + 1);
  const copy = start === 0 && end === size - 1 ? body.pipeTo(writable) : copyRange(body, { start, end }, end === size - 1, writable);
  ctx.waitUntil(copy.catch(() => {}));
  return new Response(readable, { status, headers });
}
