# Auditoría "reglas de página" — Tienda Modas Naty (2026-10-09)

Skill `reglas-de-pagina`: observa y reporta con evidencia, no corrige sola. Alcance: sitio público, kiosco y panel. Estados: ✅ presente · ⚠️ parcial · ❌ ausente · N/A no aplica (con el porqué). Severidad: 🔴 bloquea la salida · 🟡 recomendado · ⚪ opcional.

## 1. Casos extremos y estados
| Ítem | Estado | Evidencia |
|---|---|---|
| 404 coherente con el diseño | ✅ | `features/sitio/NoEncontradaSitio.jsx` (con buscador); `NoEncontrada` en panel y kiosco |
| Página 500 sin stack visible | ✅ | `app/ErrorBoundary.jsx` ("Esta pantalla tuvo un problema. Tus datos están a salvo." + Reintentar); las Functions devuelven 500 genérico sin detalle (`_lib/respuesta.js`, con prueba) |
| Estados vacíos | ✅ | `EmptyState` en catálogo, carrito, pedidos, gastos, reportes, usuarios |
| Estados de carga | ✅ | `Skeleton` en toda pantalla con datos |
| Timeouts | ⚠️ 🟡 | `useConexion` detecta "conexión lenta", pero las llamadas a Supabase no tienen tiempo máximo propio; hoy un pedido con red muy mala espera hasta que el navegador corte |
| Error boundaries | ✅ | un `ErrorBoundary` por zona (sitio, kiosco, panel) |
| Sin conexión | ✅ | franja `AvisoSinConexion` en el sitio, píldora en el panel, "Pagar con QR" deshabilitado en el kiosco; **probado cortando la red**: catálogo y ficha cargan desde la caché |
| Confirmación en acciones destructivas | ⚠️ 🟡 | cancelar/reembolsar piden motivo, baja de producto y borrado de gasto piden confirmación; **quitar del carrito** solo avisa con un toast (sin "deshacer") |

## 2. Legal
| Ítem | Estado | Evidencia |
|---|---|---|
| Términos, envíos y cambios, privacidad | ⚠️ 🔴 | existen y se editan desde el panel, pero son **BORRADOR genérico** (bloqueo B-L1): hay que revisarlos con Natali antes de publicar |
| Banner de cookies | N/A hoy | la tienda no usa scripts de terceros ni cookies de seguimiento; **pasa a ser necesario** al conectar Analytics, Clarity o Meta Pixel (tarea 9.4) |
| Licencias y atribuciones | ⚪ | fuentes Outfit y DM Sans (OFL) y lucide (ISC) autoalojadas; sin página de créditos |
| Baja en emails | N/A | no se envían emails en v1 (aviso por WhatsApp manual, B-N1) |

## 3. Pie de página
✅ completo: año calculado (`Pie.jsx`), redes solo si están cargadas (con `rel="noreferrer"`), legales, contacto, horarios, "Seguir mi pedido". Selector de idioma: N/A (solo español).

## 4. Metadatos, SEO y descubrimiento
| Ítem | Estado | Evidencia |
|---|---|---|
| Open Graph y Twitter | ✅ | `index.html` (por defecto), `lib/seo.js` (por pantalla) y Function `og-producto` (HTML de `/p/:slug` con foto, nombre y precio para WhatsApp y Google; con pruebas de escapado) |
| Favicons y manifest | ✅ | `favicon.svg`, `apple-touch-icon`, íconos 192/512/maskable, manifest con accesos directos al kiosco y al panel; **íconos provisorios "MN"** hasta el logo (B-S1) |
| `robots.txt` | ⚠️ 🟡 | bloquea panel, kiosco y recorrido de compra; falta la línea `Sitemap:` con la URL absoluta (depende del dominio, B-D1; se agrega en 9.3) |
| `sitemap.xml` | ✅ | Function `sitemap` (páginas, categorías con productos y productos publicados); **no se pudo probar contra la base real** porque el esquema no está aplicado; el armado del XML sí tiene prueba |
| `lang="es"` | ✅ | `index.html` |
| Título y descripción por página | ✅ | `useSeo` en inicio, catálogo, categoría y ficha; cada pantalla privada pone su título y `noindex` |
| Datos estructurados | ✅ | JSON-LD `Product` (precio en BOB y disponibilidad) en la ficha |

## 5. Accesibilidad y seguridad del frontend
| Ítem | Estado | Evidencia |
|---|---|---|
| `alt` | ✅ | fotos decorativas con `alt=""` a propósito (el nombre ya está en el enlace); galería y logos con nombre |
| Foco visible | ✅ | `:focus-visible` global en `index.css`; salto al contenido en el sitio |
| ARIA | ✅ | axe-core WCAG 2.1 A/AA + 2.2 AA: **0 infracciones** en 30 pantallas y estados de sitio, kiosco y panel (última pasada sobre la build real con la CSP puesta) |
| Protección de formularios | ⚠️ 🟡 | validación en cliente (zod) **y** en la base (funciones `tienda_*`); CSRF N/A (sin cookies de sesión, JWT en cabecera). **Falta limitar abusos del checkout público**: una persona (o un bot) puede crear muchos pedidos sin pagar y reservar stock por 30 min. Pendiente en la Function de checkout (etapa 5): límite por teléfono/IP y/o verificación invisible |
| Contraste | ✅ | axe + tokens verificados |
| Cabeceras de seguridad | ✅ | CSP estricta (sin scripts inline ni eval), `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`; **verificada contra la app real**: compra, kiosco, panel y descarga de Excel sin una sola violación; una prueba asegura que `netlify.toml` y `app/csp.js` sean idénticos |

## 6. Formularios
✅ errores por campo con foco al primero inválido; opcionales marcados como "(opcional)"; éxito explícito (toast o pantalla del pedido). ⚠️ 🟡 el checkout no guarda un borrador del formulario si se cierra la pestaña (el carrito sí persiste; los datos del comprador se recuerdan solo si lo activa).

## 7. Autenticación (panel)
| Ítem | Estado | Evidencia |
|---|---|---|
| Recuperar contraseña | ❌ 🟡 | `LoginRemoto` dice "pedísela a la administración"; no hay flujo de restablecer por correo |
| Cierre de sesión | ✅ | `signOut` y borrado de la base local del dispositivo |
| Errores genéricos | ✅ | "Correo o contraseña incorrectos." |
| Límite de intentos | ⚠️ 🟡 | el login lo limita Supabase Auth; **la activación del kiosco por PIN no tiene límite** (`kiosco-activar`): alguien con la URL puede probar PINs |

## 8. Comunicación transaccional
N/A en v1 (decisión B-N1: aviso por WhatsApp manual desde el panel con mensaje prearmado). Si se decide correo automático, habrá que sumar plantillas con marca.

## 9. Rendimiento y monitoreo
| Ítem | Estado | Evidencia |
|---|---|---|
| Imágenes con carga diferida | ✅ | `loading="lazy"` salvo las primeras de cada grilla (`fetchpriority="high"`) |
| Tamaño de imágenes | ⚠️ 🟡 | las fotos son de 900 px y se muestran a ~180 px en celular: es la principal causa de LCP alto en el catálogo; falta generar miniaturas al subir |
| Fuentes | ✅ | autoalojadas, `font-display: swap`, las dos principales precargadas |
| Analytics | ❌ | pendiente (9.4, requiere cuentas de Natali) |
| Error tracking | ❌ 🟡 | no hay Sentry o equivalente; hoy los errores del navegador no llegan a nadie |
| Modo mantenimiento | N/A | sitio estático; los deploys no cortan el servicio |

Lighthouse móvil (build real, perfil limpio): accesibilidad 100, SEO 100, buenas prácticas 96 en las 4 pantallas medidas. Rendimiento: inicio 85, contacto 88, ficha 76, catálogo 61. Detalle y causas en `notas-etapa-8.md`.

## 10. Localización
✅ fechas y horas en America/La_Paz y es-BO desde un solo archivo (`lib/fechas.js`); dinero solo desde `lib/moneda.js`.

## Resumen por severidad
- 🔴 **Antes de publicar**: revisar los textos legales con Natali (B-L1).
- 🟡 **Recomendado**: limitar abusos del checkout y del PIN del kiosco, recuperar contraseña, error tracking, miniaturas de fotos, timeout en llamadas de red, "deshacer" al quitar del carrito, borrador del checkout, línea `Sitemap:` con el dominio.
- ⚪ Créditos de licencias, ayuda dentro del panel.

Lista de seguimiento en `backlog-v1.1.md`.
