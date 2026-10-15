import { cloudflare } from '@cloudflare/vite-plugin';
import vinext from 'vinext';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
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
