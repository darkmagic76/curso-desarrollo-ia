# Plan 001 — Mapa de calor de estudio

Plan técnico de `specs/001-heat-map/spec.md` (RF-1 a RF-11). Respeta `docs/constitution.md`: JS puro sin dependencias ni build (P1), solo lo que pide la spec (P2), lógica pura con "hoy" como parámetro (P3), tests con `node --test` (P4), datos intactos y fechas locales (P5), código en inglés e interfaz en español (P6).

## 1. Archivos

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `logic.js` | **Crear** | Toda la lógica pura del proyecto: fechas locales, estadísticas existentes (movidas desde `app.js`) y mapa. Sin DOM ni localStorage. Script clásico que define funciones globales y, si existe `module`, las exporta para Node. | RF-1, 2, 3, 4 (texto), 6 (decisión), 7 (cálculo), 10, 11 |
| `tests/logic.test.js` | **Crear** | Tests de `logic.js` con `node:test` y `node:assert/strict`. | RNF-2 |
| `index.html` | Modificar | Tarjeta nueva entre la racha y el formulario: título, contenedor de la cuadrícula, leyenda, mensaje vacío y zona de detalle con `aria-live`. Cargar `logic.js` **antes** de `app.js`. | RF-5, 6, 7 |
| `app.js` | Modificar | Solo interfaz y datos: quitar las funciones de fecha y de estadísticas (pasan a `logic.js`); `render()` calcula `todayKey` una vez y lo pasa a todo; pintar el mapa y sus eventos. Sigue siendo el único que lee y escribe localStorage. | RF-2, 4, 8, 9, 11 |
| `styles.css` | Modificar | Cuadrícula, 5 niveles de color, celda futura, borde de hoy, foco, detalle, leyenda y responsive a 360 px. | RF-2, 3, 7, 9; RNF-4, 5 |

> ✅ Creación de `logic.js` y `tests/logic.test.js` aprobada por el usuario.

## 2. Funciones puras (`logic.js`)

Todas reciben `todayKey` ("AAAA-MM-DD") cuando dependen de hoy. Ninguna toca DOM, `localStorage` ni `new Date()` sin argumentos.

| Función | Entrada → salida | RF |
|---|---|---|
| `toLocalDateKey(date)` / `fromDateKey(key)` | Conversión local Date ↔ clave. **Se mueven** desde `app.js` (única definición). | RF-1, 11 |
| `getMondayKey(todayKey)` | Lunes de la semana de `todayKey`. Compartida por semana y mapa. | RF-1, 11 |
| `addDays(key, n)` | Clave → clave desplazada `n` días (vía `setDate`, seguro ante cambio de hora). | RF-1 |
| `isValidSession(session)` | `true` si `date` es una clave real `AAAA-MM-DD` y `minutes` es entero > 0. | RF-10 |
| `getHeatmapRange(todayKey)` | → `{ startKey, endKey }`: lunes de hace 11 semanas y domingo de la semana actual. | RF-1 |
| `sumMinutesByDay(sessions, todayKey, startKey)` | → objeto `{ clave: minutos }` solo con sesiones válidas, no futuras y dentro del rango. | RF-2, 3, 10 |
| `getLevel(minutes)` | 0 → 0; 1–29 → 1; 30–59 → 2; 60–119 → 3; ≥120 → 4. | RF-3 |
| `formatDayDetail(key, minutes, todayKey)` | → «lun 14 sep: 45 min» / «… : sin estudio»; añade el año si difiere del de hoy. | RF-4 |
| `getMonthLabels(weeks)` | → `[{ column, label }]` según RF-7 (día 1, primera columna y regla de 2 columnas). | RF-7 |
| `buildHeatmap(sessions, todayKey)` | Función principal → modelo completo (ver §3). | RF-1, 2, 3, 4, 6, 7, 9, 10 |
| `calculateStreak(sessions, todayKey)` | Racha actual (viva desde ayer si hoy no hay sesión). Misma lógica que hoy, sin `new Date()`. | RF-11 |
| `calculateBestStreak(sessions, todayKey)` | Racha más larga del historial, sin futuras. | RF-11 |
| `calculateWeekMinutes(sessions, todayKey)` | Minutos desde `getMondayKey(todayKey)` hasta hoy. | RF-11 |
| `calculateMonthDays(sessions, todayKey)` | Días distintos desde el día 1 del mes hasta hoy. | RF-11 |

Las cuatro estadísticas filtran primero con `isValidSession` (RF-11). Para sesiones válidas el resultado es idéntico al actual. `formatDate` (texto de la lista) se queda en `app.js`: es presentación y la lista muestra todas las sesiones.

Constantes: `WEEKS = 12`, `LEVEL_LIMITS = [1, 30, 60, 120]`, `DAY_NAMES = ["dom","lun",…,"sáb"]`, `MONTH_NAMES = ["ene",…,"dic"]`, `LEGEND = [{ level, text }]` (p. ej. «30–59 min»).

### Modelo devuelto por `buildHeatmap`

```
{
  weeks: [                     // 12 columnas, de la más antigua a la actual
    [ { key, minutes, level, isFuture, isToday, detail }, ... 7 días L→D ]
  ],
  monthLabels: [ { column, label } ],
  isEmpty: boolean             // ningún día visible con minutos
}
```

## 3. Algoritmo (pseudocódigo)

```
buildHeatmap(sessions, todayKey):
  { startKey } = getHeatmapRange(todayKey)
  totals = sumMinutesByDay(sessions, todayKey, startKey)
  weeks = []
  key = startKey
  repetir 12 veces:                         # RF-1
    week = []
    repetir 7 veces:
      isFuture = key > todayKey             # comparar claves de texto: seguro
      minutes  = isFuture ? 0 : (totals[key] o 0)
      week.añadir({
        key, minutes,
        level:  isFuture ? null : getLevel(minutes),      # RF-2, RF-3
        isFuture,
        isToday: key == todayKey,                          # RF-9
        detail: isFuture ? null : formatDayDetail(key, minutes, todayKey)  # RF-4
      })
      key = addDays(key, 1)
    weeks.añadir(week)
  isEmpty = ningún total en el rango > 0                   # RF-6
  devolver { weeks, monthLabels: getMonthLabels(weeks), isEmpty }

getMondayKey(todayKey):
  offset = (fromDateKey(todayKey).getDay() + 6) % 7   # lunes = 0 … domingo = 6
  devolver addDays(todayKey, -offset)

getHeatmapRange(todayKey):
  mondayThisWeek = getMondayKey(todayKey)
  devolver { startKey: addDays(mondayThisWeek, -77), endKey: addDays(mondayThisWeek, 6) }

sumMinutesByDay(sessions, todayKey, startKey):
  totals = {}
  para cada s en sessions:
    si no isValidSession(s): continuar      # RF-10
    si s.date > todayKey o s.date < startKey: continuar   # RF-2
    totals[s.date] = (totals[s.date] o 0) + s.minutes
  devolver totals

isValidSession(s):
  s es objeto Y s.date coincide con /^\d{4}-\d{2}-\d{2}$/
  Y toLocalDateKey(fromDateKey(s.date)) == s.date   # descarta 2026-02-30
  Y Number.isInteger(s.minutes) Y s.minutes > 0

getMonthLabels(weeks):
  labels = []
  para columna c de 0 a 11:
    si algún día de weeks[c] tiene día del mes == 1:
      labels.añadir({ column: c, label: MONTH_NAMES[mes de ese día] })
  si labels vacío o labels[0].column > 0:
    first = { column: 0, label: MONTH_NAMES[mes del lunes de weeks[0]] }
    si labels vacío o labels[0].column - 0 >= 2: insertar first al principio
  devolver labels

calculateStreak(sessions, todayKey):          # RF-11
  days = conjunto de fechas de sesiones válidas
  day = todayKey
  si day no está en days: day = addDays(day, -1)
  streak = 0
  mientras day esté en days: streak++, day = addDays(day, -1)
  devolver streak

calculateBestStreak(sessions, todayKey):      # RF-11
  days = fechas distintas válidas <= todayKey, ordenadas como texto
  recorrer: si fecha == addDays(anterior, 1) → current++ si no current = 1
  devolver máximo de current (0 si no hay días)

calculateWeekMinutes(sessions, todayKey):     # RF-11
  monday = getMondayKey(todayKey)
  sumar minutes de sesiones válidas con monday <= date <= todayKey

calculateMonthDays(sessions, todayKey):       # RF-11
  prefix = todayKey[0..7]                     # "AAAA-MM"
  contar fechas distintas válidas que empiezan por prefix y <= todayKey
```

### `render()` (app.js)

```
render():
  sessions = loadSessions()
  todayKey = toLocalDateKey(new Date())       # único "hoy" del pintado (RF-11)
  pintar estadísticas con calculateX(sessions, todayKey)
  renderHeatmap(buildHeatmap(sessions, todayKey))
  pintar lista con todas las sesiones (sin filtrar)
```

## 4. Pintado en la interfaz (`app.js`, `index.html`, `styles.css`)

- **Estructura** (RF-5): tarjeta con `<h2>Tu estudio en 12 semanas</h2>`, fila de meses, columna L/X/V, cuadrícula, detalle, mensaje vacío y leyenda debajo.
- **Cuadrícula** (RF-1): contenedor con `role="grid"`; CSS Grid de 7 filas con `grid-auto-flow: column` → 12 columnas L→D. Celdas como `<div role="gridcell">` con clases `level-0…level-4`, `is-future`, `is-today`.
- **Tamaño** (RNF-4): celda con `width: calc(...)`/`aspect-ratio: 1` relativa al ancho disponible para entrar en 360 px sin scroll; unidades `rem` para soportar zoom al 200 %.
- **Color** (RF-3, RNF-5): un tono de la paleta (azul tinta) en 5 intensidades vía variables CSS; nivel 0 relleno claro, futuro solo contorno (RF-2). Contraste ≥ 3:1 para niveles 1–4.
- **Hoy** (RF-9): `outline` de 2 px en tono de margen rojo; el foco usa el amarillo fluorescente para distinguirse.
- **Detalle** (RF-4): una única zona `<p id="heatmap-detail" aria-live="polite">` bajo la cuadrícula. Se rellena con `detail` en `mouseenter`, `click` (toque) y `focus`; se vacía en `mouseleave`, clic fuera y Escape. Cada celda no futura lleva `aria-label = detail`; futuras con `aria-hidden="true"` y sin listeners (RF-2).
- **Teclado** (RF-4): *roving tabindex*: una celda con `tabindex="0"` (hoy), el resto `-1`; flechas mueven ±1 fila / ±1 columna saltando futuras.
- **Leyenda** (RF-7): 5 cuadros `tabindex="0"` con `title` y `aria-label` del rango («30–59 min»); "Menos" y "Más" a los lados.
- **Etiquetas** (RF-7): meses colocados con `grid-column: column + 1`; L/X/V en las filas 1, 3 y 5.
- **Vacío** (RF-6): mensaje visible si `isEmpty`, `hidden` si no.
- **Actualización** (RF-8): `render()` llama a `renderHeatmap(buildHeatmap(sessions, todayKey))` con el mismo `todayKey` que las estadísticas; ya se invoca tras guardar. `loadSessions()` ya devuelve `[]` ante JSON ilegible (RF-10) y el mapa nunca llama a `saveSessions`.

## 5. Decisiones técnicas

| Decisión | Por qué | Alternativa descartada |
|---|---|---|
| Lógica en `logic.js` como script clásico con export condicional (`if (typeof module !== "undefined") module.exports = …`) | Funciona con doble clic (sin módulos ES) y Node puede hacer `require` para testear (P1, P3, P4). | Módulos ES: no funcionan en `file://`. Dejarla en `app.js`: depende del DOM y no se puede testear. |
| Claves de texto `AAAA-MM-DD` y comparación lexicográfica | Evita UTC y cambios de hora; coherente con los datos guardados (P5). | Comparar `Date`/milisegundos: sensible a horario de verano. |
| `todayKey` como parámetro | Tests deterministas para lunes, domingo, cambio de año, etc. (P3). | Llamar a `new Date()` dentro: no testeable. |
| Una zona de detalle con `aria-live` | Funciona igual con ratón, toque y teclado; un solo elemento que mantener (RF-4). | `title` nativo: no aparece al tocar ni con teclado. Tooltip flotante por celda: más código y posicionamiento frágil en móvil. |
| Roving tabindex | Una sola parada de Tab, como pide RF-4. | 84 celdas con `tabindex="0"`: navegación tediosa. |
| CSS Grid con `grid-auto-flow: column` | El orden del DOM es cronológico y el CSS lo coloca en columnas L→D. | Tabla HTML: obliga a recorrer por filas y complica el orden. |
| Un solo `logic.js` con fechas, estadísticas y mapa | Una única definición de las fechas (RF-11), un solo archivo que cargar antes de `app.js` y un solo archivo de tests; fácil de seguir para quien empieza. | Tres archivos (`dates.js`, `stats.js`, `heatmap.js`): más clara la separación, pero más archivos y orden de carga frágil. |
| Mover (no reescribir) las estadísticas | Mantener el mismo algoritmo y solo sustituir `new Date()` por `todayKey` minimiza el riesgo de cambiar resultados (RF-11). | Reescribirlas sobre el modelo del mapa: el mapa solo cubre 12 semanas y la mejor racha usa todo el historial. |
| Tests de caracterización antes de mover | Fijan el comportamiento actual y prueban que no cambia (RF-11, P4). | Mover y probar después: no hay forma de demostrar que el resultado es el mismo. |

## 6. Estrategia de tests (`node --test`)

- Ejecución: `node --test` desde `MyStudyDiary/` (descubre `tests/*.test.js`). Sin paquetes (P4).
- Importación: `const h = require("../logic.js")`.
- Tests en rojo bloquean avanzar (P4). Se escribe primero el test y luego la función.
- **Orden para RF-11:** primero tests de caracterización de las cuatro estadísticas (con los resultados actuales), después mover el código y sustituir `new Date()` por `todayKey`; los tests deben seguir en verde.

| Grupo | Casos | RF |
|---|---|---|
| `getHeatmapRange` | Hoy miércoles, lunes, domingo; rango de 84 días; inicio siempre lunes. | RF-1 |
| `addDays` | Cruce de mes, de año, 29 feb, cambio de hora de marzo y octubre. | RF-1 |
| `getLevel` | 0, 1, 29, 30, 59, 60, 119, 120, 5000. | RF-3 |
| `isValidSession` | Válida; minutos 0, -5, 2.5, "30", ausentes; fecha "2026-02-30", "14/09/2026", ausente; sin `createdAt` (válida). | RF-10 |
| `sumMinutesByDay` | Suma del mismo día; duplicadas suman; futuras, anteriores al rango e inválidas excluidas; no muta la entrada. | RF-2, 3, 10 |
| `formatDayDetail` | «lun 14 sep: 45 min»; «sin estudio»; con año si es de otro año. | RF-4 |
| `getMonthLabels` | Mes en columna con día 1; primera columna etiquetada; omitida si la siguiente está a < 2 columnas; cruce dic → ene. | RF-7 |
| `calculateStreak` | Sin sesiones = 0; viva desde ayer; incluye hoy; rota hace 2 días = 0; días repetidos cuentan 1; cruce de mes y de año. | RF-11 |
| `calculateBestStreak` | 0 sin sesiones; varias secuencias; repetidos; futuras ignoradas; cruce de cambio de hora. | RF-11 |
| `calculateWeekMinutes` | Hoy lunes y domingo; suma del mismo día; excluye semana pasada y futuras. | RF-11 |
| `calculateMonthDays` | Día 1 del mes; repetidos cuentan 1; excluye mes anterior y futuras. | RF-11 |
| Inválidas en estadísticas | Sesiones sin fecha o con minutos no válidos no rompen ni suman en ninguna de las cuatro. | RF-11 |
| `buildHeatmap` | 12×7 celdas; futuras con `level: null` y sin `detail`; `isToday` único; `isEmpty` sin sesiones, solo fuera de rango o solo futuras; `false` con una sesión válida en rango; `[]` y datos basura no lanzan error. | RF-1, 2, 6, 9, 10 |

Verificación manual de interfaz (no testeable con Node), con Chrome DevTools: RF-4 (ratón, toque, Escape, flechas, lector), RF-5, RF-7 (leyenda), RF-8, RF-9, RNF-4 (360 px y zoom 200 %), RNF-5 (contraste), consola sin errores.

## 7. Cobertura de RF

| RF | Dónde |
|---|---|
| RF-1 | `getHeatmapRange`, `addDays`, `buildHeatmap`, CSS Grid |
| RF-2 | `buildHeatmap` (`isFuture`), `sumMinutesByDay`, clase `is-future`, `aria-hidden` |
| RF-3 | `getLevel`, `sumMinutesByDay`, clases `level-N` |
| RF-4 | `formatDayDetail`, zona de detalle, roving tabindex |
| RF-5 | Tarjeta en `index.html` |
| RF-6 | `isEmpty`, mensaje vacío |
| RF-7 | `getMonthLabels`, leyenda, L/X/V |
| RF-8 | `render()` tras guardar |
| RF-9 | `isToday`, clase `is-today` |
| RF-10 | `isValidSession`, `loadSessions` existente, sin escrituras |
| RF-11 | `calculateStreak`, `calculateBestStreak`, `calculateWeekMinutes`, `calculateMonthDays`, `getMondayKey`, `todayKey` único en `render()` |

## 8. Notas para revisión

- Sin deuda: las estadísticas existentes pasan a cumplir P3 dentro de esta spec (RF-11).
- Hallazgo: hoy `calculateMonthDays` lanza error si una sesión guardada no tiene `date`; con `isValidSession` deja de pasar.
- Tras implementar, actualizar `AGENTS.md` (sección Stack y estructura) para incluir `logic.js` y `tests/`.
