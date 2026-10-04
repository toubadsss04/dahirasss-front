import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Build configuration.
 *
 * The application is installable on Android and iOS. Only the shell is cached:
 * financial figures are never served from a cache, because a balance read from
 * yesterday's copy would be worse than no answer at all.
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The update is offered rather than applied on its own. People type
      // amounts in this application, and a silent reload would lose an entry
      // in progress.
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png', 'favicon-64.png', 'logo.png'],
      manifest: {
        id: '/',
        name: 'Dahira Sant Serigne Saliou',
        short_name: 'Dahira SSS',
        description: 'Gestion financière du Dahira Sant Serigne Saliou, Touba unité 4',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#15233b',
        background_color: '#f4f3ee',
        categories: ['finance', 'productivity'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The opening sound is kept with the shell on purpose: it is played
        // the moment the dashboard appears, and a sound still downloading is a
        // sound nobody hears. It is also the largest asset, at about 900 KB.
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Client side routes fall back to the shell, but the API never does:
        // a request to the server must fail honestly when there is no network.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Font files change with the stylesheet URL, so they are safe to
            // keep for a long time and spare a round trip on every start.
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Off in development: a service worker caching a hot reloaded bundle
        // only produces confusing stale screens.
        enabled: false,
      },
    }),
  ],
});
