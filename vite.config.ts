import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png', 'pwa-maskable-512.png', 'manifest.json'],
          manifest: {
            id: '/',
            name: 'BREL ENERGIE - Suivi Maintenance',
            short_name: 'Brel Énergie',
            description: 'Application professionnelle de suivi de maintenance des groupes électrogènes pour Brel Energie. Notre expertise, votre solution.',
            theme_color: '#2185D0',
            background_color: '#2185D0',
            display: 'standalone',
            display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
            orientation: 'any',
            start_url: '/',
            scope: '/',
            categories: ['business', 'productivity', 'utilities'],
            lang: 'fr',
            dir: 'ltr',
            prefer_related_applications: false,
            icons: [
              {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: '/pwa-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/pwa-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'Parc Équipements',
                short_name: 'Parc',
                url: '/?tab=dashboard',
                description: 'Accéder à la liste des équipements et groupes électrogènes'
              },
              {
                name: 'Planning Interventions',
                short_name: 'Planning',
                url: '/?tab=planning',
                description: 'Consulter les interventions prévues'
              },
              {
                name: 'Carte Géographique',
                short_name: 'Carte',
                url: '/?tab=map',
                description: 'Localiser les équipements sur la carte'
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module'
          }
        })
      ],
      build: {
        chunkSizeWarningLimit: 2500,
        rollupOptions: {
          output: {
            manualChunks: {
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              vendor: ['react', 'react-dom', 'lucide-react'],
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
