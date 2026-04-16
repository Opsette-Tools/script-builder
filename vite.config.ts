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
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
      },
      manifest: {
        name: 'Script Builder',
        short_name: 'Script Builder',
        description: 'Build a structured cold call script step by step.',
        display: 'standalone',
        theme_color: '#1677ff',
        background_color: '#f5f5f5',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
