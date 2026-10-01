# AGENTS.md — Diario de Estudio

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días seguidos.
Proyecto didáctico: el código debe poder entenderlo alguien que empieza a programar.

## Stack y estructura

- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones

- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.

## Datos

- localStorage, clave `study-diary-sessions`: array de `{ date: "AAAA-MM-DD", topic, minutes, createdAt }` (`createdAt` = `Date.now()`, solo para ordenar sesiones del mismo día; puede faltar en datos antiguos).
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario perderá sus sesiones.

## Fechas y racha (fácil equivocarse)

- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
- Mejor racha = la secuencia más larga de días consecutivos con sesión en todo el historial. Se calcula al pintar, no se guarda.
- Minutos de la semana = suma de `minutes` desde el lunes (local) hasta hoy. Aquí sí cuentan todas las sesiones del día. Se calcula al pintar, no se guarda.
- Días del mes = días distintos con sesión desde el día 1 (local) hasta hoy. Se calcula al pintar, no se guarda.
- Cualquier código con fechas, días, semanas o rachas: usa la skill `local-dates` y su checklist.

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos

- Tests: `node --test` (sin instalar paquetes; prueba la lógica pura de fechas, rachas y estadísticas)

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
- La spec manda: si falta una decisión, para y pregunta.

## Límites

- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación

- Tests: `node --test` debe estar en verde antes de avanzar.
- Interfaz: después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `study-diary-sessions`
