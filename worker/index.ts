import app from 'vinext/server/fetch-handler';
import { serveStream } from './stream';

// The Worker: /stream/* plays the About page's video, and everything else is
// the vinext app. Files in public/ never get here; they are served as static
// assets first.
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (new URL(request.url).pathname.startsWith('/stream/')) return serveStream(request, env, ctx);
    return app.fetch(request, env, ctx);
  }
};
