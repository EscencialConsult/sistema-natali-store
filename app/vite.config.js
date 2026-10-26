import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

// Versión que se muestra en la app (menú y Ajustes): el número de package.json, que se sube a propósito en cada publicación
// (1.2.0 → 1.2.1 arreglo chico, 1.3.0 novedad, 2.0.0 cambio grande). Sirve para saber en un segundo qué versión tiene cada equipo.
// La fecha de compilación va aparte (Ajustes) por si dos compilaciones salen con el mismo número.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const ahora = new Date(Date.now() - 3 * 3600 * 1000).toISOString() // hora de Argentina/Bolivia
const COMPILADA = `${ahora.slice(8, 10)}/${ahora.slice(5, 7)}/${ahora.slice(0, 4)} ${ahora.slice(11, 16)}`

export default defineConfig({
  define: { __VERSION_APP__: JSON.stringify(version), __COMPILADA_APP__: JSON.stringify(COMPILADA) },
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
        // La app instalada es la del equipo y vive en /admin; la raíz (/) es la tienda pública.
        id: '/admin/',
        start_url: '/admin/',
        scope: '/admin/',
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
        // El mapa de la tienda pública (MapLibre y su worker, ~1,5 MB) tampoco: el equipo no lo usa desde la app instalada.
        globIgnores: ['**/exceljs*.js', '**/MapaLibre*.{js,css}', '**/maplibre-gl*.js'],
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
