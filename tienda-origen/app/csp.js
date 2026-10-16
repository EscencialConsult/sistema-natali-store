// Política de seguridad de contenido (CSP) de la tienda. UNA sola fuente: la usan `vite preview` (para probarla contra la app
// real) y se copia a netlify.toml (una prueba comprueba que sean idénticas).
// - Scripts solo propios (sin inline ni eval): un XSS no puede ejecutar código nuevo.
// - Conexiones: la propia app (y sus Netlify Functions), Supabase y la API de Mercado Pago.
// - Imágenes: propias, data: (portada), blob: (fotos recién subidas) y el Storage de Supabase.
// - Nadie puede meter esta app en un iframe (clickjacking) ni cambiar la base de URLs.
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

export const CABECERAS_SEGURIDAD = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
}
