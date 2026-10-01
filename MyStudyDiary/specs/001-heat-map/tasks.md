# Tareas 001 — Mapa de calor de estudio

Basadas en `spec.md` y `plan.md`. Orden de dependencia: no empezar una tarea hasta terminar las anteriores. Regla de la constitución (P4): con `node --test` en rojo no se avanza. Cada test se escribe **antes** que la función que prueba.

## Fase 1 — Base de lógica y tests

- [x] **T1. Crear `logic.js` y `tests/logic.test.js` vacíos y conectarlos.**
  `logic.js` como script clásico con export condicional; `index.html` lo carga antes de `app.js`; test de humo que hace `require("../logic.js")`.
  RF: RF-11 (base) · RNF-1, RNF-2
  Hecho cuando: `node --test` pasa con 1 test y `index.html` abierto con doble clic funciona igual que antes, sin errores en consola.

- [x] **T2. Mover `toLocalDateKey` y `fromDateKey` a `logic.js` con tests.**
  Tests: cruce de mes y de año, 29 feb, cambio de hora. Borrarlas de `app.js`.
  RF: RF-1, RF-11
  Hecho cuando: tests en verde, ambas funciones existen solo en `logic.js` y la página muestra las mismas fechas y estadísticas que antes.

- [x] **T3. `addDays` y `getMondayKey` con tests.**
  Tests: ±1 día en cruces de mes/año, cambio de hora de marzo y octubre; lunes de un lunes, miércoles y domingo.
  RF: RF-1, RF-11
  Hecho cuando: `node --test` en verde con todos esos casos.

- [x] **T4. `isValidSession` con tests.**
  Tests: válida; sin `createdAt` (válida); minutos 0, -5, 2.5, "30", ausentes; fechas "2026-02-30", "14/09/2026", ausente.
  RF: RF-10, RF-11
  Hecho cuando: `node --test` en verde con todos los casos.

## Fase 2 — Estadísticas existentes como lógica pura (RF-11)

- [x] **T5. Tests de caracterización de `calculateStreak` y mover la función.**
  Tests primero (con resultados actuales): sin sesiones, viva desde ayer, incluye hoy, rota, repetidos, cruce de mes/año. Mover a `logic.js` con firma `(sessions, todayKey)`, sin `new Date()`, filtrando con `isValidSession`.
  RF: RF-11
  Hecho cuando: tests en verde, la función no aparece en `app.js` y no contiene `new Date()`.

- [x] **T6. Ídem para `calculateBestStreak`.**
  Tests: 0 sin sesiones, varias secuencias, repetidos, futuras ignoradas, cruce de cambio de hora.
  RF: RF-11
  Hecho cuando: tests en verde, función solo en `logic.js` y sin `new Date()`.

- [x] **T7. Ídem para `calculateWeekMinutes` (usando `getMondayKey`).**
  Tests: hoy lunes y domingo, suma del mismo día, excluye semana pasada y futuras.
  RF: RF-11
  Hecho cuando: tests en verde, función solo en `logic.js` y sin `new Date()`.

- [x] **T8. Ídem para `calculateMonthDays`.**
  Tests: día 1 del mes, repetidos, excluye mes anterior y futuras, sesión sin `date` no lanza error.
  RF: RF-11
  Hecho cuando: tests en verde, función solo en `logic.js` y sin `new Date()`.

- [x] **T9. Un único `todayKey` en `render()`.**
  `render()` calcula `todayKey` una vez y lo pasa a las cuatro estadísticas.
  RF: RF-11
  Hecho cuando: `app.js` contiene una sola llamada a `new Date()` para "hoy" en `render()`, y en el navegador las cuatro cifras coinciden con las de antes del cambio con los mismos datos.

## Fase 3 — Lógica del mapa

- [x] **T10. `getLevel` con tests.**
  Tests: 0, 1, 29, 30, 59, 60, 119, 120, 5000.
  RF: RF-3
  Hecho cuando: `node --test` en verde con los 9 casos.

- [x] **T11. `getHeatmapRange` con tests.**
  Tests: hoy miércoles, lunes y domingo; el inicio es lunes; el rango tiene 84 días.
  RF: RF-1
  Hecho cuando: `node --test` en verde con esos casos.

- [x] **T12. `sumMinutesByDay` con tests.**
  Tests: suma del mismo día, duplicadas suman, excluye futuras, anteriores al rango e inválidas, no modifica el array de entrada.
  RF: RF-2, RF-3, RF-10
  Hecho cuando: `node --test` en verde con esos casos.

- [x] **T13. `formatDayDetail` con tests.**
  Tests: «lun 14 sep: 45 min», «lun 14 sep: sin estudio», año añadido si es de otro año (p. ej. «lun 29 dic 2025: 45 min»).
  RF: RF-4
  Hecho cuando: `node --test` en verde con esos casos.

- [x] **T14. `getMonthLabels` con tests.**
  Tests: mes en la columna con el día 1, primera columna etiquetada, omitida si la siguiente está a menos de 2 columnas, cruce dic → ene.
  RF: RF-7
  Hecho cuando: `node --test` en verde con esos casos.

- [x] **T15. `buildHeatmap` con tests.**
  Tests: 12×7 celdas; futuras con `level: null` y sin `detail`; un solo `isToday`; `isEmpty` sin sesiones, solo fuera de rango y solo futuras; `false` con una sesión válida en rango; `[]` y datos basura no lanzan error.
  RF: RF-1, RF-2, RF-6, RF-9, RF-10
  Hecho cuando: `node --test` en verde con todos los casos.

## Fase 4 — Interfaz

- [ ] **T16. Estructura HTML de la tarjeta.**
  Entre la racha y el formulario: título, fila de meses, L/X/V, contenedor `role="grid"`, zona de detalle `aria-live`, mensaje vacío y leyenda.
  RF: RF-5, RF-6, RF-7
  Hecho cuando: la tarjeta aparece en su sitio en el navegador (aún vacía) y la consola no muestra errores.

- [ ] **T17. `renderHeatmap`: pintar celdas, meses y estado vacío.**
  Crear 84 celdas con clases `level-N`, `is-future`, `is-today`; `aria-label` en no futuras y `aria-hidden` en futuras; colocar meses; mostrar u ocultar el mensaje vacío. Llamarla desde `render()` con el mismo `todayKey`.
  RF: RF-1, RF-2, RF-6, RF-7, RF-8, RF-9
  Hecho cuando: en DevTools hay 84 celdas, las futuras tienen `aria-hidden`, y al guardar una sesión de hoy su celda cambia de nivel sin recargar.

- [ ] **T18. Estilos de la cuadrícula y niveles.**
  CSS Grid en columnas, 5 niveles de un tono con variables CSS, futuras solo con contorno, borde de hoy distinto del foco.
  RF: RF-1, RF-2, RF-3, RF-9 · RNF-5
  Hecho cuando: se distinguen los 5 niveles, futuras y hoy a simple vista, y DevTools reporta contraste ≥ 3:1 en los niveles 1–4 frente al fondo.

- [ ] **T19. Detalle con ratón y toque.**
  `mouseenter`/`click` muestran el detalle; `mouseleave`, clic fuera y Escape lo ocultan; las futuras no responden.
  RF: RF-2, RF-4
  Hecho cuando: en escritorio y en emulación móvil se ve el texto correcto al pasar o tocar, cambia al tocar otra celda y desaparece al tocar fuera o pulsar Escape.

- [ ] **T20. Navegación por teclado (roving tabindex).**
  Una sola parada de Tab (hoy); flechas ±1 fila/columna saltando futuras; el foco muestra el detalle.
  RF: RF-4
  Hecho cuando: con solo teclado se entra al mapa con un Tab, se recorre con flechas sin llegar a futuras, el detalle sigue al foco y el siguiente Tab sale del mapa.

- [ ] **T21. Leyenda y etiquetas L/X/V.**
  5 cuadros enfocables con su rango en `title` y `aria-label`, "Menos" y "Más" a los lados; L/X/V en sus filas.
  RF: RF-7
  Hecho cuando: al pasar, tocar o enfocar cada cuadro se ve su rango (p. ej. «30–59 min») y las iniciales quedan alineadas con lunes, miércoles y viernes.

- [ ] **T22. Responsive y zoom.**
  Ajustar tamaños para 360 px y zoom al 200 %.
  RNF-4
  Hecho cuando: en emulación de 360 px y con zoom al 200 % el mapa se ve completo y sin desplazamiento horizontal.

## Fase 5 — Cierre

- [ ] **T23. Verificación completa con Chrome DevTools.**
  Recorrer RF-1 a RF-11 en escritorio y móvil; probar sin sesiones, con datos antiguos y con datos inválidos inyectados en localStorage.
  RF: RF-1 a RF-11
  Hecho cuando: todos los criterios de aceptación se cumplen, la consola no muestra errores, `node --test` está en verde y las sesiones ya guardadas siguen intactas.

- [ ] **T24. Actualizar documentación.**
  `AGENTS.md` (Stack y estructura: `logic.js` y `tests/`) y `MEMORY.md` (estado, decisiones, aprendizajes).
  RF: —
  Hecho cuando: ambos archivos reflejan la nueva estructura y `MEMORY.md` sigue en ~50 líneas o menos.
