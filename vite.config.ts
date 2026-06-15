import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// Base path for GitHub Pages project site. Matches the repo name.
// Update this if the repo is renamed.
const BASE = '/script-builder/';

export default defineConfig({
  base: BASE,
  server: {
    host: '::',
    port: 8113,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      manifest: false,
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/~oauth/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
