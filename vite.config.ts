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

/**
 * Puts the built CSS into index.html as a <style> element instead of linking
 * a separate file, so Chrome DevTools can always edit its rules. For a linked
 * stylesheet, DevTools opened after the page loaded has to fetch the text
 * again, and when that fails (as in Chrome 158) every rule is read-only until
 * the page is reloaded. Every URL serves this one page, so the CSS costs the
 * same either way.
 */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (html?.type !== 'asset') return;
      let text = String(html.source);
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue;
        const href = '/' + file.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const link = new RegExp(`<link rel="stylesheet"[^>]*href="${href}"[^>]*>`);
        if (!link.test(text)) continue;
        const css = typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source);
        text = text.replace(link, () => `<style>${css}</style>`);
        delete bundle[file.fileName];
      }
      html.source = text;
    }
  };
}

// A single-page React app. The Cloudflare plugin builds the small Worker in
// worker/ (it serves only /stream/*) and runs it in the dev server and in
// `vite preview`, so both behave like the deployed site.
export default defineConfig({
  plugins: [react(), videoSizes(), inlineCss(), cloudflare()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } }
});
