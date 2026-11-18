import { serveStream } from './stream';

// The Worker runs only for /stream/* (run_worker_first in wrangler.jsonc),
// which plays the About page's video. Every other request is a static file, or
// index.html for a page URL, and is answered before it gets here; anything else
// that reaches the Worker is a missing file.
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (new URL(request.url).pathname.startsWith('/stream/')) return serveStream(request, env, ctx);
    return new Response('Not found', { status: 404 });
  }
};
