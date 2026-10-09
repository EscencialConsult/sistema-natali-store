# Modas Naty — ERP Notas de Venta + Módulo Catálogo

Carpeta de documentación viva del proyecto. Todo lo que se vaya sabiendo va acá.

## Índice

| Archivo | Contenido |
|---|---|
| [01-pedido-cliente.md](01-pedido-cliente.md) | Lo que pidió la clienta (Natali), tal cual llegó, ordenado |
| [02-erp-actual.md](02-erp-actual.md) | Qué hace hoy el ERP (`HTML-DEMO.html`, demo en Netlify) |
| [03-modulo-catalogo.md](03-modulo-catalogo.md) | Módulo de catálogo a cotizar + análisis de la referencia |
| [04-preguntas-abiertas.md](04-preguntas-abiertas.md) | Lo que falta preguntar/definir antes de cotizar |
| [05-equipo-y-roles.md](05-equipo-y-roles.md) | Personal registrado (6 personas) y roles a modelar |
| [06-arquitectura.md](06-arquitectura.md) | Stack, modelo de datos, offline-first, estrategia de migración |
| [plan/tareas-v1.md](plan/tareas-v1.md) | **Tablero**: 10 etapas, tareas y estado (detalle en `plan/etapa-N.md`, reglas en `plan/_comun.md`) |
| [plan/guion-prueba.md](plan/guion-prueba.md) | **Guion de prueba por rol** (Etapa 7) + [hallazgos](plan/hallazgos-etapa-7.md) |
| [biblioteca-provisional/](biblioteca-provisional/README.md) | 138 productos de prueba con foto y precio (para armar el frontend) |
| [referencias/diseno/](referencias/diseno/README.md) | **Análisis de DISEÑO de la referencia** + capturas (lo importante) |
| [referencias/divashousebolivia/](referencias/divashousebolivia/_index.md) | Rastrillaje de texto del sitio (145 páginas) — baja prioridad: la referencia es de diseño |
| [cliente/](cliente/) | Material crudo: capturas, logo, mensajes (para ir sumando) |

## Estado (2026-10-08)
- Etapas 0 a 6 hechas (frontend completo; falta la sesión de prueba real de la etapa 7). **Etapa 8**: backend (Supabase) construido y probado en memoria; falta conectarlo a un proyecto real. Ver `plan/tareas-v1.md` y `../app/supabase/README.md`.
- (histórico) Proyecto arrancado el 2026-10-08. Hay demo del ERP (`../HTML-DEMO.html`, online: https://plataformventas.netlify.app/).
- Stack decidido: React + Vite + Tailwind + lucide + animate; Supabase (genérico, luego migra a la cuenta del cliente). Ver 06.
- Hay que: (1) aplicar cambios al ERP, (2) cotizar módulo catálogo.
- Repo GitHub: **por ahora NO** (decisión 2026-10-08). Todo local en la compu; se sube a GitHub cuando haya más avance.
