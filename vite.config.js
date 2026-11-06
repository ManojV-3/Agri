import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icons/*.png',
        'icons/*.svg',
        'fonts/*.woff2',
        'model/*',
        'audio/**/*.mp3',
        'audio-manifest.json',
        'data/*.json'
      ],
      manifest: {
        name: 'CropCare - Offline Leaf Disease Advisor',
        short_name: 'CropCare',
        description: 'Mobile-first, offline-first crop leaf disease detection and treatment cost advisor for farmers in English and Kannada.',
        theme_color: '#1B5E20',
        background_color: '#F1F8E9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB to cache TF.js and models
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,mp3}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/fonts/') || url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cropcare-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/audio/') || url.pathname.endsWith('.mp3'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cropcare-audio-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 90
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/model/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cropcare-model-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 90
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cropcare-data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          tfjs: ['@tensorflow/tfjs'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'dexie', 'i18next', 'react-i18next', 'recharts']
        }
      }
    }
  }
});
