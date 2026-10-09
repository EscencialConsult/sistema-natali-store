import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': la app avisa cuando hay versión nueva y la persona decide cuándo actualizar (no a mitad de una venta).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Modas Naty · Notas de venta',
        short_name: 'Modas Naty',
        description: 'Catálogo y notas de venta de Modas Naty. Funciona sin internet.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fbf7f3',
        theme_color: '#8a3a63',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La app completa (código, estilos, fuentes, íconos) queda guardada: abre y vende sin internet.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // La librería de Excel pesa ~1 MB y solo se usa en cargas masivas: se guarda la primera vez que se usa.
        globIgnores: ['**/exceljs*.js'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Fotos del catálogo en Supabase Storage (bucket naty_productos): se guardan para verlas sin señal.
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/naty_productos/'),
            handler: 'CacheFirst',
            options: { cacheName: 'fotos-catalogo', expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: ({ url }) => /exceljs.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'carga-masiva', cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'node',
    // Las pruebas de Excel y de base en memoria cargan librerías pesadas: con varios archivos en paralelo 5 s no alcanza.
    testTimeout: 30_000,
    // Las pruebas nunca tocan el Supabase real aunque exista .env.local (las de servidor usan un Postgres en memoria).
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
})
