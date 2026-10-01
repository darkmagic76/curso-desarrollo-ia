# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- Proceso: spec-driven (`docs/constitution.md` + `specs/NNN-*/`); lógica pura testeada con `node --test`.
- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- Mejor racha añadida: en la misma tarjeta que la racha actual, más pequeña, con 🏆.
- Total de minutos de esta semana, en la misma tarjeta.
- Días estudiados este mes ("Este mes: N días"), en la misma tarjeta.
- Datos en localStorage (clave `study-diary-sessions`).
- Rediseño "libreta": fondo cuadriculado, tinta azul, margen rojo en tarjetas, fluorescente bajo la racha. Estadísticas en fila de 3 (`.stats`); en móvil, apiladas.

## Decisiones de diseño

- Variables CSS en `:root` para la paleta; solo fuentes del sistema (funciona sin conexión).
- Un único elemento llamativo (la racha); el resto, sobrio. Contenido alineado a la izquierda.

## Decisiones (y por qué)

- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- La mejor racha se calcula a partir de las sesiones, no se guarda: así nunca se desincroniza de los datos.
- Sin aviso de "¡Récord!": no se pidió.
- Total semanal: semana de lunes a domingo (habitual en España; "últimos 7 días" baja sin motivo aparente). Solo minutos, como en la lista.

## Aprendizajes y errores a evitar

- AGENTS.md y el código tenían claves de localStorage distintas; se corrigió la documentación (el código manda) para no perder datos guardados.
- Para comparar días consecutivos usar `fromDateKey` + `setDate` + `toLocalDateKey`, nunca `toISOString()`.
- Días del mes: filtrar por prefijo `AAAA-MM` del texto evita `Date` y problemas de cambio de hora. Formato sin "de 31": no se pidió.

## Próximos pasos

- Spec del mapa de calor redactada en `specs/001-heat-map/spec.md` (12 semanas L–D, 5 tramos fijos de minutos, detalle por día, leyenda y etiquetas). Revisada por QA: 30 hallazgos resueltos, sin dudas abiertas (añadidos RF-9 hoy y RF-10 datos inválidos).
- Spec activa: `specs/001-heat-map/` con `plan.md`. Aprobados `logic.js` (toda la lógica pura: fechas, estadísticas y mapa) y `tests/logic.test.js`. RF-11: las estadísticas existentes pasan a recibir "hoy" (sin deuda). `tasks.md` con 24 tareas (T1–T24). T1–T9 hechas: RF-11 completo (fechas, isValidSession y 4 estadísticas en logic.js; render() usa un único todayKey; 47 tests). Siguiente: T10 (lógica del mapa). Tests fijan TZ=Europe/Madrid para probar cambio de hora.
