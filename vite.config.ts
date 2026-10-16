import { readdirSync, statSync } from 'node:fs';
import { cloudflare } from '@cloudflare/vite-plugin';
import vinext from 'vinext';
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

export default defineConfig({
  plugins: [
    videoSizes(),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr']
      }
    })
  ],
  // Pre-bundle client dependencies up front. Otherwise the dev server finds
  // Base UI's per-component entry points one page at a time, re-optimizes, and
  // the reloaded chunks can end up with a second copy of React.
  optimizeDeps: {
    include: [
      '@base-ui/react/avatar',
      '@base-ui/react/button',
      '@base-ui/react/checkbox',
      '@base-ui/react/combobox',
      '@base-ui/react/input',
      '@base-ui/react/menu',
      '@base-ui/react/preview-card',
      '@base-ui/react/select',
      '@base-ui/react/switch',
      '@base-ui/react/toggle',
      '@base-ui/react/toggle-group',
      '@xyflow/react',
      'lucide-react'
    ]
  }
});
