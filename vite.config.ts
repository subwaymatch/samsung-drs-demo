import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * `virtual:video-sizes`: the size in bytes of each file in public/video, read
 * at build time. /stream needs them for its Content-Range headers, and the
 * assets binding does not send a Content-Length.
 */
function videoSizes(): Plugin {
  const id = 'virtual:video-sizes';
  return {
    name: 'video-sizes',
    resolveId: s => (s === id ? '\0' + id : undefined),
    load(s) {
      if (s !== '\0' + id) return;
      const dir = 'public/video/';
      const sizes = Object.fromEntries(readdirSync(dir).map(f => [f, statSync(dir + f).size]));
      return 'export default ' + JSON.stringify(sizes);
    }
  };
}

// A single-page React app. The Cloudflare plugin builds the small Worker in
// worker/ (it serves only /stream/*) and runs it in the dev server and in
// `vite preview`, so both behave like the deployed site.
export default defineConfig({
  plugins: [react(), videoSizes(), cloudflare()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }
});
