# Spec 001 — Mapa de calor de estudio

## 1. Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha, los minutos de la semana y los días del mes. Son cifras sueltas: no permiten ver de un vistazo **cómo se reparte el estudio en el tiempo** (huecos, semanas fuertes, constancia).

**Objetivo:** mostrar un mapa de calor de las últimas 12 semanas, al estilo del de GitHub, donde cada día es una celda cuyo color es más intenso cuantos más minutos se estudiaron. Así la constancia se vuelve visible y motiva a no dejar huecos.

## 2. Usuarios

- **Estudiante que usa el diario a diario**: quiere ver su constancia reciente y detectar días sin estudio.
- **Estudiante que vuelve tras una pausa**: quiere ver dónde se cortó su ritmo.
- **Usuario de teclado o lector de pantalla**: necesita la misma información sin depender del color.

## 3. Historias de usuario

- **HU-1**: Como estudiante, quiero ver mis últimas 12 semanas en un mapa para saber de un vistazo qué días estudié.
- **HU-2**: Como estudiante, quiero que el color refleje cuánto estudié para distinguir días flojos de días intensos.
- **HU-3**: Como estudiante, quiero consultar la fecha y los minutos exactos de un día para no depender de interpretar colores.
- **HU-4**: Como estudiante sin estudio reciente, quiero entender el mapa aunque esté vacío para saber cómo empezar a llenarlo.
- **HU-5**: Como estudiante, quiero una leyenda y etiquetas de días y meses para orientarme en el mapa.

## 4. Requisitos funcionales

### RF-1 — Rango de 12 semanas

- **Cuando** se pinta la página, **el sistema deberá** mostrar 84 celdas (12 semanas × 7 días), desde el lunes de hace 11 semanas hasta el domingo de la semana que contiene hoy.
- **El sistema deberá** organizar las filas de lunes (arriba) a domingo (abajo) y las columnas de la más antigua (izquierda) a la actual (derecha), en cualquier tamaño de pantalla.
- **El sistema deberá** determinar "hoy" y todas las fechas con la fecha local del dispositivo en el momento de pintar.
- **El sistema deberá** empezar la semana en lunes, independientemente del idioma del navegador.
- **Mientras** la página siga abierta tras la medianoche, **el sistema** no está obligado a actualizar el mapa hasta el siguiente pintado (guardar una sesión o recargar).

### RF-2 — Días futuros

- **Mientras** una celda corresponda a un día posterior a hoy, **el sistema deberá** mostrarla solo con contorno y sin relleno, distinta del nivel 0 (que sí tiene relleno claro).
- **Mientras** una celda sea futura, **el sistema deberá** excluirla de la navegación por teclado, no mostrar detalle al pasar el ratón o tocarla y ocultarla a los lectores de pantalla.
- **Si** existen sesiones con fecha futura, **entonces el sistema deberá** ignorarlas en el mapa.

### RF-3 — Intensidad por tramos fijos

- **El sistema deberá** sumar los minutos de todas las sesiones válidas de cada día.
- **El sistema deberá** asignar a cada día uno de 5 niveles según su total, con ambos extremos incluidos:
  - Nivel 0: 0 minutos.
  - Nivel 1: de 1 a 29 minutos.
  - Nivel 2: de 30 a 59 minutos.
  - Nivel 3: de 60 a 119 minutos.
  - Nivel 4: 120 minutos o más.
- **El sistema deberá** usar un único tono cuya intensidad crece con el nivel, de forma que cada nivel sea distinguible del contiguo.

### RF-4 — Detalle de un día

- **Cuando** el usuario pase el ratón, toque o enfoque con el teclado una celda de un día pasado o de hoy, **el sistema deberá** mostrar su detalle con el formato «día-semana día mes: N min», con el día de la semana y el mes abreviados en español (p. ej.: «lun 14 sep: 45 min»).
- **Mientras** el día no pertenezca al año actual, **el sistema deberá** añadir el año (p. ej.: «lun 29 dic 2025: 45 min»).
- **Mientras** un día tenga 0 minutos, **el sistema deberá** mostrar el detalle con el formato «lun 14 sep: sin estudio».
- **Cuando** el usuario toque otra celda, **el sistema deberá** mostrar el detalle de la nueva; **cuando** toque fuera del mapa o pulse Escape, **el sistema deberá** ocultarlo.
- **El sistema deberá** permitir la navegación por teclado con una sola parada de tabulación en el mapa y moverse entre días con las flechas.
- **El sistema deberá** ofrecer a los lectores de pantalla el mismo texto del detalle para cada día no futuro.

### RF-5 — Ubicación

- **El sistema deberá** mostrar el mapa en una tarjeta propia, situada entre la tarjeta de la racha y el formulario de registro.

### RF-6 — Estado vacío

- **Mientras** ningún día del rango visible tenga minutos (sin sesiones, o con sesiones solo fuera del rango o futuras), **el sistema deberá** mostrar el mapa completo en nivel 0 y el mensaje «Registra tu primera sesión para empezar a llenar el mapa».
- **Cuando** al menos un día del rango visible tenga minutos, **el sistema deberá** ocultar ese mensaje.

### RF-7 — Leyenda y etiquetas

- **El sistema deberá** mostrar bajo el mapa una leyenda «Menos ▢▢▢▢▢ Más» con los 5 niveles; **cuando** el usuario pase el ratón, toque o enfoque un nivel de la leyenda, **el sistema deberá** mostrar su rango de minutos, y ese rango deberá estar disponible para lectores de pantalla.
- **El sistema deberá** mostrar las iniciales L, X y V junto a las filas de lunes, miércoles y viernes.
- **El sistema deberá** mostrar el nombre del mes abreviado en español (ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic) sobre la columna que contiene el día 1 de ese mes.
- **El sistema deberá** mostrar también el mes de la primera columna del rango, aunque ese mes haya empezado antes.
- **Si** la etiqueta de la primera columna quedaría a menos de 2 columnas de la siguiente etiqueta de mes, **entonces el sistema deberá** omitir la de la primera columna.

### RF-8 — Actualización

- **Cuando** el usuario guarde una sesión, **el sistema deberá** actualizar el mapa sin recargar la página.

### RF-9 — Día de hoy

- **El sistema deberá** resaltar la celda de hoy con un borde visible, distinguible del foco del teclado, sin alterar su nivel de color.

### RF-10 — Datos inválidos

- **Si** una sesión guardada tiene una fecha mal formada o unos minutos que no son un número entero mayor que 0, **entonces el sistema deberá** ignorarla en el mapa sin mostrar error.
- **El sistema deberá** dejar intactos los datos guardados: el mapa solo los lee, nunca los modifica ni borra.
- **Si** los datos guardados no se pueden leer, **entonces el sistema deberá** mostrar el mapa en estado vacío (RF-6) sin bloquear el resto de la página.

### RF-11 — Estadísticas existentes como lógica pura

Motivo: los cálculos actuales (racha actual, mejor racha, minutos de la semana y días del mes) consultan la fecha del sistema por su cuenta y no se pueden probar, lo que incumple los principios 3 y 4 de la constitución.

- **El sistema deberá** calcular la racha actual, la mejor racha, los minutos de la semana y los días del mes como lógica pura que recibe "hoy" como parámetro.
- **El sistema deberá** usar un único "hoy" por pintado para todas las estadísticas y el mapa, de modo que no puedan contradecirse si el pintado ocurre en el cambio de día.
- **El sistema deberá** mostrar exactamente los mismos resultados que antes del cambio para cualquier conjunto de sesiones válidas.
- **El sistema deberá** reutilizar una sola definición de las operaciones de fechas locales para las estadísticas y el mapa.
- **Si** una sesión guardada es inválida (RF-10), **entonces el sistema deberá** ignorarla también en las estadísticas, sin modificar los datos guardados ni dejar de mostrarla en la lista.

## 5. Requisitos no funcionales

- **RNF-1**: Cumple la constitución: sin dependencias ni build; funciona abriendo la página con doble clic.
- **RNF-2**: Son lógica pura que recibe "hoy" como parámetro, probada automáticamente: el cálculo de las 84 fechas, los totales por día, los niveles, el filtrado de sesiones inválidas y futuras, el texto del detalle, la posición de las etiquetas de mes y la decisión de estado vacío.
- **RNF-3**: No cambia el formato de los datos guardados; el mapa se calcula al pintar y no se guarda.
- **RNF-4**: Se ve completo en un móvil de 360 px de ancho sin desplazamiento horizontal, y sigue siendo usable con el zoom del navegador al 200 %.
- **RNF-5**: Accesible: la información no depende solo del color; contraste mínimo de 3:1 entre cada celda con nivel ≥ 1 y el fondo de la tarjeta; foco del teclado visible.
- **RNF-6**: Textos de la interfaz en español.

## 6. Casos límite

- Varias sesiones el mismo día: se suman sus minutos (p. ej. 20 + 15 = 35 → nivel 2).
- Sesiones duplicadas exactas: se suman como sesiones distintas.
- Totales exactos de 29, 30, 59, 60, 119 y 120 minutos: nivel 1, 2, 2, 3, 3 y 4 respectivamente.
- Totales muy altos (p. ej. 5000 minutos): nivel 4.
- Minutos 0, negativos, decimales o no numéricos: sesión ignorada (RF-10).
- Hoy es lunes: la última columna tiene 6 días futuros.
- Hoy es domingo: la última columna no tiene días futuros.
- Sesiones anteriores al rango: no aparecen en el mapa, pero siguen contando en rachas y en la lista.
- Sesiones con fecha futura: se ignoran en el mapa.
- Cambio de hora (marzo y octubre): no duplica ni salta días.
- Cambio de mes o de año dentro del rango: etiquetas correctas (p. ej. «dic» y «ene») y año en el detalle de los días del año anterior.
- Sesiones guardadas antes de esta funcionalidad: se muestran igual.
- Datos guardados ilegibles: mapa vacío, resto de la página operativo.
- Cambio de zona horaria o reloj del dispositivo incorrecto: se usa la fecha local del dispositivo tal cual; no se corrige.

## 7. Fuera de alcance

- Filtrar la lista de sesiones al pulsar un día.
- Cambiar el número de semanas o navegar a semanas anteriores.
- Tramos de intensidad relativos al máximo del usuario o configurables.
- Desglose por tema en el detalle del día.
- Editar o borrar sesiones (desde el mapa o desde cualquier otro sitio).
- Actualizar el mapa automáticamente al pasar la medianoche con la página abierta.
- Modo oscuro y temas de color.
- Avisar de sesiones guardadas fuera del rango visible.

## 8. Criterios de finalización

- Ninguna estadística existente consulta la fecha del sistema por su cuenta y todas tienen tests en verde (RF-11), incluyendo racha viva desde ayer, racha rota, días repetidos, fechas futuras, lunes/domingo y cambio de mes.
- Todos los RF-1 a RF-11 cumplen sus criterios de aceptación.
- Los tests automáticos de la lógica pura (RNF-2) están en verde, incluidos los casos límite de la sección 6 que sean de lógica.
- Verificado en el navegador: escritorio, móvil de 360 px y zoom al 200 %; navegación por teclado; consola sin errores.
- Las sesiones ya guardadas siguen visibles y sin cambios.
- No queda ninguna duda marcada como [NECESITA ACLARACIÓN].

## 9. Dudas abiertas

- Ninguna. Las tres dudas anteriores quedaron resueltas en RF-10 (datos inválidos), RF-9 (día de hoy) y RF-7 (solape de etiquetas de mes).
