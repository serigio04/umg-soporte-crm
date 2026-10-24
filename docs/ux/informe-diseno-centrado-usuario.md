# Informe de diseño centrado en el usuario del Sistema de Soporte UMG

Este informe analiza el cliente React y los servicios que condicionan su experiencia. Se trata de una inspección documental y de código con propuestas de diseño y validación. No constituye una certificación de conformidad con ISO, una auditoría formal de accesibilidad ni evidencia de investigación o pruebas con usuarios ya ejecutadas. Las personas, recorridos, métricas objetivo y especificaciones de prototipo son hipótesis de trabajo que deben contrastarse con participantes reales. Salvo el resumen vigente de 5.1.1.1, las secciones 5.1 y 5.2 conservan la línea base examinada entre el 22 y el 23 de octubre de 2026; la sección 5.3.10 documenta el sistema implementado posteriormente y prevalece cuando describe una función corregida o añadida.

## 5.1 ISO 9241-210 y Customer Journey Maps

### 5.1.1 Alcance y fundamento

ISO 9241-210 plantea un proceso de diseño centrado en las personas que: comprende explícitamente usuarios, tareas y entornos; involucra a usuarios durante el desarrollo; conduce y refina el diseño mediante evaluación; itera; considera la experiencia completa; y reúne capacidades multidisciplinarias. El sistema analizado administra solicitudes de soporte de estudiantes mediante autenticación, creación y seguimiento de tickets, atención por agentes, supervisión por coordinación, base de conocimiento y encuestas (`README.md:1-18`). Las rutas materializan tres roles: Estudiante, Agente y Coordinador (`client/src/App.jsx:27-59`).

El análisis abarca los flujos críticos que aparecen en el código: inicio de sesión; autoservicio en preguntas frecuentes; creación, asignación, listado y detalle de tickets; cambio de estado, prioridad, reasignación y escalamiento; chat persistente en tiempo real; aceptación de una resolución y encuesta; métricas, reportes y gestión de agentes; y gestión de conocimiento. La descripción vigente se comprobó contra el código; las diferencias históricas entre backlog y línea base se conservan como contexto del proceso iterativo.

#### 5.1.1.1 Resumen del sistema implementado

| Capacidad vigente | Comportamiento implementado y evidencia |
|---|---|
| Asignación | Cuando crea un Estudiante o Coordinador, la API ejecuta Round Robin transaccional por coincidencia exacta entre tipología y especialidad, con cursor bloqueado por especialidad. Si no existe candidato, conserva `idAgente = NULL`. Cuando crea un Agente, el caso se autoasigna a ese agente (`server/src/services/ticket.service.js`). |
| SLA y flujo | La tipología establece prioridad y plazo inicial: Incidente/Alta/4 h, Solicitud/Media/24 h y Cambio/Baja/48 h. El equipo de soporte solo puede avanzar `Abierto → EnProceso → Pendiente → Resuelto`; no puede cerrar, saltar o retroceder estados. Solo el Estudiante propietario cierra desde `Resuelto` al aceptar la solución. Prioridad, candidatos y reasignación se limitan a estados activos (`Abierto`, `EnProceso`, `Pendiente`); cambiar prioridad reinicia el SLA desde ese momento. |
| Carné | Para crear un ticket en nombre de un estudiante, UI y API requieren `9989-XX-XXXXX`. El controlador valida el patrón y elimina guiones para buscar el valor compacto almacenado, por ejemplo `99892311046` (`CrearTicket.jsx`; `ticket.controller.js`). |
| Conversación | Los mensajes de texto, de 1 a 4,000 caracteres, se persisten y solo son visibles para Estudiante propietario, Agente asignado o Coordinación. Un ticket cerrado mantiene el historial en solo lectura y rechaza mensajes nuevos (`message.service.js`; `ticket-access.service.js`; `TicketChat.jsx`). |
| Tiempo real | Socket.IO valida el JWT de la conexión. `ticket:join` vuelve a autorizar antes de entrar en la sala, `ticket:leave` la abandona y el servidor publica `ticket:message` y `ticket:updated`. Tras reasignar o escalar, `refrescarAccesosTicket` expulsa de la sala a sockets que perdieron acceso; el nuevo Agente se autoriza al abrir el ticket y volver a unirse. REST mantiene la persistencia y respaldo (`server/src/realtime.js`; `client/src/services/socket.js`). |
| Escala de listados | La paginación operativa usa 15 elementos en tickets, vencidos, agentes y conocimiento; el listado global de Coordinación usa 25. `Pagination` anuncia página y resultados. |
| Coordinación | La gestión de agentes presenta una bienvenida una vez por sesión mediante `sessionStorage`, permite crear agentes y cambiar especialidad. `GET /api/metricas/tickets` entrega JSON y los tres endpoints de reporte son exclusivos de Coordinación. Los reportes de tickets exportan ID, tipología, prioridad, estado, fechas de creación/resolución/cierre, solución, estado SLA, agente y estudiante; el de calificaciones exporta agente, promedio 1-5 y porcentaje. |
| Conocimiento | FAQ y gestión agrupan por categoría, ordenan el contenido y usan `General` cuando no hay categoría; la gestión conserva vistas de tabla y tarjetas responsive. |
| Presentación | El sistema aplica diseño responsive desde 320 px, identidad violeta y componentes accesibles: foco visible, salto a contenido, etiquetas/ayuda, regiones de estado, controles táctiles, filtros seleccionados anunciables, diálogos con gestión de foco y texto además del color. Esto no equivale a certificación WCAG. |

### 5.1.2 Contexto de uso

> **Línea base histórica:** desde esta sección hasta el cierre de 5.2 se preservan observaciones de la inspección del 22-23 de octubre de 2026. Las afirmaciones sobre carné, transiciones, permisos o UI que contradigan 5.1.1.1 y 5.3.10 describen el estado anterior y ya no representan el producto implementado.

| Dimensión | Contexto sustentado en el repositorio | Riesgo o necesidad de validación |
|---|---|---|
| Personas usuarias | Estudiantes consultan perfil, FAQ y sus tickets; agentes atienden tickets y artículos; coordinadores supervisan métricas, reportes, agentes y tickets. El control de rutas por rol está en `client/src/App.jsx:31-59` y `client/src/components/RutaProtegida.jsx:20-38`. | Reclutar participantes reales por rol y experiencia digital; confirmar si existen asistentes, personal administrativo u otros consumidores no representados. |
| Objetivos | Resolver dudas sin abrir ticket; registrar y seguir solicitudes; resolver, comentar o escalar casos; vigilar SLA y satisfacción. La API asigna prioridad Alta/Media/Baja según Incidente/Solicitud/Cambio (`server/src/services/ticket.service.js:13-19`) y calcula límites de 4/24/48 horas (`server/src/services/ticket.service.js:175-181`). | Confirmar terminología ITIL, comprensión de SLA y criterios de urgencia con usuarios. |
| Tareas | Acceder con correo y contraseña; buscar artículos; elegir tipología y describir un problema; filtrar tickets; consultar detalle e historial; actualizar estado; aceptar solución; calificar; descargar reportes. | Medir frecuencia, criticidad, secuencia real y tareas excepcionales, especialmente escalamiento y errores. |
| Entorno técnico | Aplicación web React/Vite que consume una API en `http://localhost:3000/api` (`client/src/services/api.js:3-5`), con sesión JWT de ocho horas (`server/src/services/auth.service.js:22-25`). | La URL fija es de desarrollo. Deben validarse navegadores, equipos institucionales, políticas de almacenamiento, latencia y despliegue real. |
| Entorno físico | El backlog solicita uso móvil para formularios, atención y dashboards (`docs/agile/backlog.md:65-73`); el uso también puede ocurrir en escritorio para tablas y reportes. | No hay datos observacionales sobre ruido, movilidad, iluminación, conectividad o uso con una mano. |
| Entorno social | Un estudiante puede abrir su caso; agente o coordinador también puede crearlo para un estudiante (`client/src/pages/CrearTicket.jsx:22-43`). El escalamiento transfiere el caso a coordinación (`server/src/services/ticket.service.js:312-346`). | Aclarar privacidad al mostrar datos del estudiante, protocolos de traspaso y expectativas de respuesta. |
| Restricciones | Autorización por rol en frontend y backend; los tickets cerrados no muestran edición en el detalle (`client/src/pages/DetalleTicket.jsx:28-33,136-178`). | El detalle `GET /tickets/:idTicket` exige token, pero la ruta no limita por rol ni se observa comprobación de propiedad (`server/src/routes/ticket.route.js:14`; `server/src/services/ticket.service.js:151-215`); requiere revisión de seguridad fuera del alcance de esta inspección UX. |

### 5.1.3 Personas provisionales

Estas personas son arquetipos de diseño derivados de roles y tareas del código, no resultados de entrevistas.

| Persona | Situación, objetivo y conducta | Necesidades y principales barreras hipotéticas |
|---|---|---|
| **Ana, estudiante de 20 años** | Consulta desde un teléfono entre clases. Quiere solucionar una dificultad de plataforma o crear un ticket y comprobar su estado sin aprender terminología de soporte. | Lenguaje claro, formularios breves, confirmación con número y SLA, estado comprensible sin depender del color, controles táctiles y consumo moderado de datos. |
| **Carlos, agente de soporte de 31 años** | Atiende varios casos durante su jornada, alternando portátil y teléfono. Prioriza por SLA, actualiza estados, documenta una solución y escala excepciones. | Cola ordenable, contexto del estudiante, transición de estado válida, comentarios obligatorios cuando corresponda, prevención de errores y acciones rápidas accesibles por teclado y tacto. |
| **Marta, coordinadora de 42 años** | Supervisa carga, vencimientos y satisfacción, reasigna especialidades, descarga informes y atiende escalaciones principalmente desde escritorio. | Resumen confiable, filtros y tablas adaptables, definiciones de métricas, confirmaciones de acciones, acceso a casos críticos y reportes con retroalimentación de descarga. |

### 5.1.4 Requisitos centrados en el usuario

| ID | Requisito verificable | Origen/evidencia | Criterio de aceptación propuesto |
|---|---|---|---|
| UX-R01 | Cada rol debe llegar a su inicio correcto y no ver acciones no autorizadas. | Rutas por rol en `client/src/App.jsx:31-59`; redirección en `client/src/components/RutaProtegida.jsx:20-34`. | Con sesión válida, 100 % de accesos directos de la matriz de permisos muestran la pantalla autorizada o una explicación y redirección segura. |
| UX-R02 | El estudiante debe intentar autoservicio antes o durante la creación de un ticket. | FAQ con búsqueda en `client/src/pages/PreguntasFrecuentes.jsx:193-221`; la creación actual no integra sugerencias (`client/src/pages/CrearTicket.jsx:64-141`). | Al escribir al menos tres caracteres del asunto/descripción se ofrecen resultados relevantes, que pueden abrirse y cerrarse sin perder lo escrito. |
| UX-R03 | Crear un ticket debe comunicar tipología, prioridad, plazo, progreso y resultado. | Prioridad previa en `client/src/pages/CrearTicket.jsx:86-117`; tras éxito solo se ejecuta `navigate(-1)` (`client/src/pages/CrearTicket.jsx:37-49`). | El éxito presenta ID, prioridad, límite y acciones “Ver ticket”/“Volver”; un doble envío no crea duplicados. |
| UX-R04 | El carné debe usar una representación consistente y validación comprensible. | **Observación de línea base, resuelta:** antes el backlog definía `9989-XX-XXXXX` y la UI usaba número/`parseInt`. | Implementado: campo textual con patrón y ejemplo; API valida `9989-XX-XXXXX` y normaliza a almacenamiento compacto. |
| UX-R05 | La atención debe permitir únicamente transiciones válidas y explicar restricciones. | **Observación de línea base, resuelta:** el selector anterior ofrecía estados sin secuencia y el servicio solo comprobaba pertenencia. | Implementado: `Abierto → EnProceso → Pendiente → Resuelto`; `Cerrado` solo por aceptación del Estudiante propietario. |
| UX-R06 | El estado, prioridad y vencimiento no deben depender exclusivamente de color o emoji. | Badges de color en listados y detalle, por ejemplo `client/src/pages/HistorialTickets.jsx:5-17,101-105` y `client/src/pages/DetalleTicket.jsx:116-133`. | Texto, icono con nombre accesible y patrón/forma complementan el color; contraste AA medido en todos los estados. |
| UX-R07 | Los flujos críticos deben operar desde 320 px hasta escritorio sin desplazamiento horizontal de página. | Las vistas usan grids y tablas fijas, por ejemplo `client/src/pages/DashboardAgente.jsx:266-294`; solo la tabla de conocimiento declara `overflowX` (`client/src/pages/GestionConocimiento.jsx:591-608`). | A 320, 360, 390, 768, 1024 y 1440 px no existe overflow horizontal de página; tablas usan tarjetas, columnas prioritarias o scroll local identificado. |
| UX-R08 | Todo control debe ser operable y perceptible con teclado y lector de pantalla. | Hay encabezados de acordeón implementados como `div` con `onClick` (`client/src/pages/PreguntasFrecuentes.jsx:243-259`) y modales sin semántica (`client/src/components/CambiarPassword.jsx:34-85`). | Orden de foco lógico, foco visible, nombre/rol/estado accesible, apertura/cierre por teclado, foco contenido y restaurado en modales. |
| UX-R09 | Carga, vacío, error, éxito y sesión expirada deben tener mensajes accionables y consistentes. | Existen combinaciones de texto, `alert`, silenciamiento y `console.error`, por ejemplo `client/src/pages/EncuestaTicket.jsx:14-45` y `client/src/pages/DashboardCoordinador.jsx:24-31,78-118`. | Cada operación asíncrona muestra estado; los errores conservan datos y ofrecen reintento; un 401/403 conduce a reautenticación con explicación. |
| UX-R10 | El coordinador debe poder interpretar métricas y tablas en móvil y escritorio. | Métricas, carrusel, tablas y reportes en `client/src/pages/DashboardCoordinador.jsx:144-389`. | Cada métrica tiene nombre, valor, periodo/definición y estado sin datos; tablas poseen encabezados, adaptación móvil y navegación de página anunciada. |
| UX-R11 | La encuesta debe ser comprensible sin depender de estrellas. | Cinco botones con el mismo texto visible `★` en `client/src/pages/EncuestaTicket.jsx:63-81`. | Cada opción anuncia “n de 5”, el grupo tiene pregunta/leyenda y la selección se comunica visualmente y a tecnologías de asistencia. |
| UX-R12 | El sistema debe conservar la identidad visual existente mientras unifica sus componentes. | Predominan fondo `#f4f4f4`, superficie `#fff`, tinta `#1a1a2e`, acentos semánticos y `sans-serif` en las páginas; coordinación usa `#6c3483` (`client/src/pages/DashboardCoordinador.jsx:395-414`). | Tokens compartidos reproducen esos valores, sin introducir una nueva familia tipográfica o paleta de marca; se ajustan combinaciones solo cuando el contraste lo exija. |

### 5.1.5 Proceso iterativo propuesto

| Iteración | Actividades y participantes | Entregable y puerta de decisión |
|---|---|---|
| 0. Alineación | Revisar reglas con soporte, coordinación, desarrollo y responsable de accesibilidad; inventariar analítica disponible. Históricamente incluía resolver carné y estados, decisiones que ya fueron implementadas. | Contexto aprobado, riesgos, matriz de reglas y tareas críticas; conservar trazabilidad de las decisiones vigentes. |
| 1. Descubrimiento | Entrevistas semiestructuradas y observación contextual con 4-6 participantes por rol; encuesta breve solo como complemento; revisión de tickets anonimizados. | Personas revisadas, vocabulario, mapa de tareas y recorridos “actuales”. Las personas de este informe se sustituyen o corrigen con evidencia. |
| 2. Estructura | Card sorting moderado para estudiante y agente, tree testing de navegación, bosquejos mobile-first y análisis conjunto con backend. | Arquitectura, navegación y flujos de baja fidelidad con al menos 80 % de éxito en tareas de localización prioritarias. |
| 3. Prototipo | Componentes atómicos y prototipo Figma de fidelidad media/alta; revisión heurística y WCAG por dos evaluadores. | Prototipo navegable sin hallazgos de severidad 4 abiertos y con especificación de estados. |
| 4. Evaluación | Pruebas moderadas con 5-8 participantes por rol por ronda, móvil y escritorio; teclado y lectores de pantalla con usuarios o especialistas. | Métricas ISO 9241-11, problemas observados y decisión iterar/implementar según umbrales. |
| 5. Implementación y control | Construcción incremental, pruebas automáticas, QA responsive/accesible y prueba de aceptación con soporte. | Criterios UX-R aprobados, telemetría ética y lista de deuda conocida. |
| 6. Aprendizaje | Revisar abandono, errores, tiempo, contactos repetidos y satisfacción a 2 y 6 semanas; entrevistas de seguimiento. | Nueva línea base y backlog reordenado. El ciclo se repite, no se da por concluido con una sola prueba. |

### 5.1.6 Customer Journey Map 1: estudiante resuelve o registra una solicitud

Recorrido esperado a validar con Ana. El sistema actual ofrece FAQ y creación como acciones separadas en el dashboard (`client/src/pages/DashboardEstudiante.jsx:69-83`).

| Etapa | Objetivo y acciones | Punto de contacto/evidencia actual | Pensamiento o emoción hipotética | Fricción/riesgo observable | Oportunidad y señal de éxito |
|---|---|---|---|---|---|
| 1. Acceso | Ingresar correo y contraseña. | `/login`; formulario en `client/src/pages/Login.jsx:33-63`. | “Necesito entrar rápido.” Confianza media. | No hay estado de envío, recuperación ni mensaje de sesión expirada; el error siempre indica credenciales incorrectas. | Indicar progreso, explicar error sin revelar cuentas y ofrecer recuperación. Éxito: acceso al primer intento o recuperación iniciada. |
| 2. Orientación | Elegir FAQ o crear ticket. | Tres acciones rápidas en `client/src/pages/DashboardEstudiante.jsx:69-83`. | “¿Puedo resolverlo ahora?” | FAQ y ticket no forman un solo flujo; el perfil y último ticket compiten por espacio en móvil. | Destacar “Buscar solución” y mantener “Crear ticket”; medir selección y abandono. |
| 3. Autoservicio | Buscar, explorar categoría y abrir artículo. | Búsqueda y acordeones en `client/src/pages/PreguntasFrecuentes.jsx:193-318`. | Esperanza si reconoce sus palabras. | Acordeones y artículos son `div` clicables; el modal carece de semántica/foco; el contenido HTML necesita control de confianza. | Botones semánticos, resultados con fragmentos, “¿Esto resolvió tu problema?”. Éxito: resolución declarada sin ticket. |
| 4. Formulación | Elegir tipo y describir el problema. | `/tickets/nuevo`; tipología, SLA y descripción en `client/src/pages/CrearTicket.jsx:64-141`. | Incertidumbre ante términos Incidente/Solicitud/Cambio. | No hay asunto, adjuntos ni sugerencias FAQ; emojis y color aportan significado; mínimo de 10 caracteres aparece solo al fallar. | Explicaciones con ejemplos, validación en contexto y sugerencias no bloqueantes. Éxito: formulario válido sin correcciones evitables. |
| 5. Confirmación | Conocer número, prioridad y plazo. | La API devuelve esos datos (`server/src/services/ticket.service.js:61-79`), pero la UI vuelve a la página previa (`client/src/pages/CrearTicket.jsx:37-49`). | “¿Sí se envió?” Ansiedad potencial. | Ausencia de confirmación persistente y riesgo de reenvío. | Pantalla de éxito con ID, SLA, estado y siguiente acción. Éxito: 100 % identifica el ID tras crear. |
| 6. Seguimiento | Filtrar tickets, abrir detalle y comprender SLA/historial. | `/estudiante/tickets` y `/tickets/:idTicket`; `client/src/pages/HistorialTickets.jsx:72-137`, `client/src/pages/DetalleTicket.jsx:97-219`. | Necesidad de certeza. | “Horas restantes” llega a 0 incluso vencido; estados técnicos y colores pueden confundir; navegación “Volver” depende del historial. | Línea temporal con lenguaje claro, fecha límite absoluta y destino estable. Éxito: identifica estado y próxima acción en menos de 20 s. |
| 7. Cierre y opinión | Revisar solución, aceptar y calificar. | Aceptación en `client/src/pages/DetalleTicket.jsx:180-196`; encuesta en `client/src/pages/EncuestaTicket.jsx:50-107`. | Alivio o frustración según solución. | `alert` interrumpe; estrellas no tienen etiquetas individuales; encuesta solo aparece habilitada si existe una pendiente. | Confirmación no modal, escala verbal y posibilidad de reportar “no resuelto”. Éxito: cierre informado y respuesta sin error. |

### 5.1.7 Customer Journey Map 2: agente atiende y escala un ticket

Recorrido esperado a validar con Carlos.

| Etapa | Objetivo y acciones | Punto de contacto/evidencia actual | Pensamiento o emoción hipotética | Fricción/riesgo observable | Oportunidad y señal de éxito |
|---|---|---|---|---|---|
| 1. Priorizar | Revisar métricas, vencidos y caso prioritario. | Dashboard con tres KPI, tabla de vencidos y ticket prioritario (`client/src/pages/DashboardAgente.jsx:93-178,204-250`). | “¿Qué debo atender primero?” | Tabla sin adaptación; no se ve fecha límite absoluta ni orden configurable; tres columnas fijas. | Cola unificada por SLA con urgencia textual. Éxito: selecciona el caso crítico correcto en menos de 30 s. |
| 2. Filtrar cola | Ver asignados por estado. | Filtros y tarjetas en `client/src/pages/TicketsAsignados.jsx:49-95`. | Control si el filtro es evidente. | El botón “Todos” usa una clave tipográfica inexistente (`filstroBtn`) y ningún filtro muestra estado activo (`client/src/pages/TicketsAsignados.jsx:58-65,101-124`). | Control segmentado con selección programática y contador. Éxito: cero errores al encontrar estado solicitado. |
| 3. Diagnosticar | Leer descripción, estudiante, prioridad, SLA e historial. | Detalle en `client/src/pages/DetalleTicket.jsx:97-134,198-218`. | “¿Tengo suficiente contexto?” | Valores largos pueden colisionar en filas; historial ordenado descendente desde servicio (`server/src/services/ticket.service.js:167-173`), sin autor visible. | Jerarquía móvil, datos copiables, historial con autor y orden explícito. Éxito: explica problema y último cambio correctamente. |
| 4. Actualizar | Elegir estado y dejar comentario técnico. | Selector y comentario en `client/src/pages/DetalleTicket.jsx:136-177`. | Quiere avanzar sin dañar el flujo. | Todos los estados están disponibles y comentario es opcional; se navega atrás tras guardar sin confirmación contextual. | Próxima transición, justificación contextual, confirmación y actualización in situ. Éxito: cero transiciones inválidas y comentario útil. |
| 5. Escalar | Transferir una excepción a coordinación. | Botón para Agente y `window.confirm` (`client/src/pages/DetalleTicket.jsx:72-84,99-105`); backend reasigna y vuelve a Abierto (`server/src/services/ticket.service.js:332-343`). | Cautela por perder responsabilidad. | La interfaz no anticipa que el estado volverá a Abierto ni muestra nuevo responsable antes de salir. | Diálogo con consecuencias y motivo; resultado con responsable. Éxito: agente predice efecto y confirma solo cuando corresponde. |
| 6. Verificar | Comprobar resolución, carga y vencimientos. | Historial del agente y métricas (`client/src/pages/HistorialTicketsAgente.jsx:36-93`; `client/src/pages/DashboardAgente.jsx:93-178`). | Cierre y aprendizaje. | Listas separadas, falta búsqueda y no hay confirmación persistente del cambio. | Enlace al caso actualizado, filtros persistentes y actividad reciente. Éxito: localiza el caso modificado sin rehacer la búsqueda. |

### 5.1.8 Customer Journey Map 3: coordinadora supervisa y actúa

Recorrido esperado a validar con Marta.

| Etapa | Objetivo y acciones | Punto de contacto/evidencia actual | Pensamiento o emoción hipotética | Fricción/riesgo observable | Oportunidad y señal de éxito |
|---|---|---|---|---|---|
| 1. Situarse | Revisar tiempo medio, carga y satisfacción. | Tres paneles en `client/src/pages/DashboardCoordinador.jsx:168-257`. | “¿El servicio está bajo control?” | No se presenta periodo de cálculo, muestra ni definición; el carrusel exige recorrer agentes uno por uno. | Filtros de periodo, definiciones y comparación. Éxito: interpreta cada KPI sin ayuda. |
| 2. Detectar riesgo | Examinar SLA incumplidos. | Tabla paginada en `client/src/pages/DashboardCoordinador.jsx:259-315`. | Urgencia ante vencidos. | No hay acción “Ver”, búsqueda ni adaptación móvil; usa color para prioridad. | Lista priorizada con enlace al detalle, antigüedad y responsable. Éxito: abre el caso más crítico en un paso. |
| 3. Revisar tickets | Acceder a “Todos los tickets”. | `/coordinador/tickets`, pero consulta `/tickets/abiertos` (`client/src/pages/HistorialTicketsCoordinador.jsx:25-34`) y no renderiza filtros pese a definir estilos. | Espera visión completa. | Etiqueta “Todos”/“Historial” contradice que el backend devuelve solo Abiertos (`server/src/services/ticket.service.js:288-309`). | Nombrar “Tickets abiertos” o ampliar consulta; añadir búsqueda/filtros. Éxito: expectativa coincide con conjunto mostrado. |
| 4. Gestionar equipo | Cambiar especialidad de agente. | Tabla y edición en línea (`client/src/pages/DashboardCoordinador.jsx:317-389`). | Precaución por impacto de asignación. | Guardar no confirma consecuencias ni éxito; tablas densas; opción inicial depende del estado local. | Confirmar impacto, mensaje de éxito y diseño de filas/tarjetas. Éxito: cambio correcto y verificable sin ambigüedad. |
| 5. Informar | Descargar CSV, Excel y calificaciones. | Tres botones y descarga programática (`client/src/pages/DashboardCoordinador.jsx:78-118,156-164`). | Espera evidencia para decisiones. | Fallos solo en consola; no hay progreso, periodo ni confirmación. | Menú “Exportar”, formato/periodo, progreso y error recuperable. Éxito: descarga correcta y archivo identificable. |
| 6. Mantener conocimiento | Crear, editar o borrar artículos. | CRUD y editor en `client/src/pages/GestionConocimiento.jsx:255-501`. | Busca consistencia y prevención de borrados accidentales. | Ruta permite Agente y Coordinador (`client/src/App.jsx:40-47`); `document.execCommand` está obsoleto; modal/foco no gestionados; confirmación nativa. | Permisos acordados, editor accesible, vista previa y diálogo seguro. Éxito: publica un artículo estructurado y recupera foco. |

### 5.1.9 Métricas de usabilidad y plan de prueba

Según ISO 9241-11, la usabilidad debe evaluarse en un contexto especificado mediante **efectividad** (exactitud y completitud), **eficiencia** (recursos empleados respecto al resultado) y **satisfacción** (respuesta física, cognitiva y emocional). Los valores siguientes son objetivos iniciales, no mediciones obtenidas.

| Dimensión | Métrica y cálculo | Objetivo inicial | Instrumentación/evidencia |
|---|---|---|---|
| Efectividad | Éxito por tarea = participantes que alcanzan el estado final correcto / participantes que intentan. | ≥ 90 % en login, crear, ver detalle y cambiar estado; ≥ 85 % en autoservicio, escalar y exportar. | Observación, estado final en API y lista de criterios por tarea. |
| Efectividad | Éxito sin ayuda y errores críticos por tarea. | ≥ 80 % sin ayuda; 0 errores críticos en cierre, escalamiento y cambio de especialidad. | Registro de ayudas, clics/teclas y consecuencias. |
| Efectividad | Comprensión: identifica estado, responsable, prioridad y fecha límite. | ≥ 90 % de respuestas correctas tras 20 s de exposición al detalle. | Preguntas posteriores sin consultar la pantalla. |
| Eficiencia | Tiempo de tarea, mediana y percentil 90 desde consigna hasta resultado. | Crear ticket ≤ 2:30 min; localizar/actualizar asignado ≤ 2:00 min; abrir vencido crítico ≤ 45 s. | Cronómetro de prueba y eventos con marcas de tiempo. |
| Eficiencia | Pasos excedentes = acciones observadas menos camino óptimo; tasa de reintento. | Mediana ≤ 2 pasos excedentes; reintentos de envío < 2 %. | Grabación de sesión anonimizada y telemetría de eventos, con consentimiento. |
| Satisfacción | Single Ease Question (SEQ, 1-7) después de cada tarea. | Mediana ≥ 5.5 y ningún flujo crítico < 5. | Cuestionario inmediato por tarea. |
| Satisfacción | System Usability Scale (SUS, 0-100) al final de la sesión. | ≥ 75 como meta de producto, interpretada junto con muestra y contexto. | SUS validada en español; no sustituye observación. |
| Satisfacción | Confianza para no perder datos y claridad del estado, escala 1-5. | Mediana ≥ 4. | Dos ítems específicos y entrevista de cierre. |
| Accesibilidad | Tareas completadas solo con teclado y con lector de pantalla; defectos WCAG por nivel. | 100 % de tareas críticas con teclado; 0 bloqueos A/AA. | NVDA + Firefox/Chrome en Windows, VoiceOver + Safari en iOS, inspección y automatización. |

**Diseño de la prueba.** Realizar dos rondas formativas. En cada ronda: 5-8 estudiantes, 5-8 agentes y 5-8 coordinadores, procurando diversidad en experiencia digital y al menos participantes que utilicen tecnologías de asistencia. No mezclar resultados entre roles sin segmentación. Usar datos ficticios y un entorno aislado; obtener consentimiento; no registrar contraseñas, carnés reales ni contenido sensible.

**Dispositivos.** Estudiantes: teléfono de 360-390 px y, como contraste, portátil. Agentes: teléfono y escritorio de 1366 px. Coordinadores: escritorio y tableta. Incluir zoom al 200 %, orientación vertical/horizontal, teclado, NVDA y VoiceOver. Probar con latencia simulada y respuestas 400, 401/403, 404 y 500.

**Tareas.** T1 iniciar sesión; T2 encontrar una respuesta y declarar si resolvió el problema; T3 crear un ticket y recordar su ID/plazo; T4 filtrar y explicar un ticket; T5 actualizar un estado con comentario; T6 escalar explicando consecuencias; T7 aceptar solución y responder encuesta; T8 detectar y abrir el SLA más crítico; T9 cambiar una especialidad; T10 exportar un reporte. El moderador no debe enseñar la interfaz ni sugerir etiquetas.

**Análisis.** Reportar mediana, rango y tasa por tarea/rol/dispositivo, no significancia inferencial con muestras pequeñas. Clasificar incidentes por impacto y frecuencia, contrastar con la inspección heurística, corregir primero bloqueos y repetir las tareas afectadas. Los eventos de producción, si se incorporan, requieren minimización de datos, retención definida y revisión institucional.

## 5.2 Evaluación heurística: Nielsen, ISO 9241-11 y WCAG 2.2

### 5.2.1 Método y escala

La evaluación es una inspección estática del código disponible; no se ejecutó una auditoría formal, prueba con participantes ni certificación. Se aplica la escala de severidad de Nielsen: **0** no es problema; **1** cosmético; **2** menor; **3** mayor; **4** catastrófico o bloqueante. La severidad combina frecuencia probable, impacto y persistencia, y debe recalibrarse mediante pruebas.

### 5.2.2 Matriz de hallazgos heurísticos de la línea base

Los hallazgos siguientes son evidencia histórica, no una lista de defectos vigentes. Su remediación implementada se registra en 5.3.10; en particular H05 y H12 quedaron superados por el formato normalizado de carné y el flujo estricto con cierre exclusivo del estudiante.

| ID | Heurística de Nielsen | Hallazgo y evidencia | Impacto ISO 9241-11 | Sev. | Recomendación verificable |
|---|---|---|---|---:|---|
| H01 | 1. Visibilidad del estado del sistema | Login no muestra envío; descargas solo registran error en consola; creación vuelve atrás sin confirmar ID (`client/src/pages/Login.jsx:11-31`; `client/src/pages/DashboardCoordinador.jsx:78-118`; `client/src/pages/CrearTicket.jsx:37-49`). | Efectividad y satisfacción: incertidumbre, repetición o abandono. | 3 | Estados cargando/éxito/error consistentes; deshabilitar doble envío; éxito de ticket con ID y SLA. |
| H02 | 2. Correspondencia sistema-mundo real | “Incidente”, “Solicitud”, “Cambio”, “SLA” y `EnProceso` carecen de explicación orientada a estudiante (`client/src/pages/CrearTicket.jsx:86-117`; `client/src/pages/HistorialTickets.jsx:54-90`). | Efectividad: clasificación o interpretación incorrecta. | 2 | Etiquetas legibles, ejemplos y “En proceso”; conservar valor técnico solo en datos/API. |
| H03 | 3. Control y libertad | Muchas acciones usan `navigate(-1)`, cuyo destino depende del historial; modales cierran al tocar fondo sin advertir cambios (`client/src/pages/DetalleTicket.jsx:51-53`; `client/src/pages/GestionConocimiento.jsx:337-500`). | Eficiencia y satisfacción: pérdida de contexto/datos. | 3 | Destinos explícitos por rol, confirmación de descarte y restauración de foco/estado de filtro. |
| H04 | 4. Consistencia y estándares | Mezcla alertas nativas, texto, tarjetas y mensajes de consola; coordinación llama “Todos los tickets” a una vista que solicita solo abiertos (`client/src/pages/DashboardCoordinador.jsx:153-155`; `client/src/pages/HistorialTicketsCoordinador.jsx:25-40`). | Efectividad: expectativas falsas; eficiencia: reaprendizaje. | 3 | Sistema de feedback y nomenclatura únicos; alinear etiqueta y consulta. |
| H05 | 5. Prevención de errores | **Línea base, resuelto:** el selector permitía cualquier estado y el carné numérico contradecía la máscara documentada. | Efectividad histórica: datos o flujo inválidos. | 4 | Implementado posteriormente: secuencia estricta en UI/API y carné formateado con normalización compacta. |
| H06 | 6. Reconocimiento antes que recuerdo | El detalle muestra contexto, prioridad e historial, y la creación anticipa prioridad/SLA (`client/src/pages/DetalleTicket.jsx:97-134`; `client/src/pages/CrearTicket.jsx:108-117`). | Mejora eficiencia y comprensión. | 0 | Conservar estas señales; añadir fecha límite absoluta, responsable y siguiente estado válido. |
| H07 | 7. Flexibilidad y eficiencia | Los listados permiten filtros, pero el agente carece de búsqueda/orden y el coordinador carece de filtros renderizados; filtros no persisten (`client/src/pages/TicketsAsignados.jsx:37-65`; `client/src/pages/HistorialTicketsCoordinador.jsx:32-83`). | Eficiencia: exploración repetitiva al crecer el volumen. | 2 | Búsqueda, orden por SLA, filtros persistentes y atajos sin ocultar camino básico. |
| H08 | 8. Diseño estético y minimalista | Dashboards acumulan acciones, perfil, KPI y tablas; la coordinación presenta tres exportaciones separadas (`client/src/pages/DashboardCoordinador.jsx:144-389`). | Eficiencia y satisfacción: carga visual y prioridad difusa. | 2 | Jerarquizar “requiere atención”, agrupar exportaciones y revelar detalle progresivamente. |
| H09 | 9. Reconocer, diagnosticar y recuperarse de errores | Varias cargas convierten error en lista vacía o `null`, confundiendo “sin datos” con fallo (`client/src/pages/DashboardEstudiante.jsx:14-40`; `client/src/pages/TicketsAsignados.jsx:26-35`). | Efectividad: decisión basada en datos ausentes; satisfacción baja. | 3 | Separar carga/vacío/error, describir impacto, conservar entrada y ofrecer Reintentar. |
| H10 | 10. Ayuda y documentación | Hay textos breves, pero no ayuda contextual sobre tipología, estados, SLA o impacto de escalar; FAQ está separada del formulario. | Efectividad y eficiencia: dependencia de soporte y errores de selección. | 2 | Ayuda contextual breve y enlace a artículos relevantes sin bloquear. |
| H11 | 1 y 4. Estado/consistencia | En Tickets asignados, “Todos” referencia `styles.filstroBtn`, inexistente, y ningún botón combina estilo activo (`client/src/pages/TicketsAsignados.jsx:58-65,101-124`). | Efectividad: selección actual invisible; satisfacción. | 2 | Aplicar estado seleccionado visual y `aria-pressed`; cubrir con prueba de componente. |
| H12 | 5. Prevención de errores | **Línea base, resuelto en su regla principal:** la UI mezclaba Cerrado/Cancelado y no hacía explícita la secuencia. | Efectividad histórica: modelo mental y datos inconsistentes. | 3 | Implementado posteriormente: soporte avanza hasta `Resuelto`; solo el estudiante cierra al aceptar. |
| H13 | 3 y 5. Control/prevención | Eliminar artículos y escalar dependen de confirmaciones del navegador; editar conocimiento puede cerrarse al pulsar overlay (`client/src/pages/GestionConocimiento.jsx:152-166,337-345`). | Satisfacción y efectividad: acciones irreversibles o pérdida. | 3 | Diálogo accesible con objeto/consecuencia, cancelación segura y, si es posible, deshacer eliminación. |
| H14 | 6. Reconocimiento | Tarjetas e historial sí exponen descripción, fechas, estado y prioridad cerca de la acción (`client/src/pages/HistorialTicketsAgente.jsx:61-89`). | Favorece efectividad. | 0 | Preservar contenido y mejorar adaptación, sin ocultar información esencial detrás de hover. |
| H15 | 7. Flexibilidad | Dashboard de coordinación pagina 20 filas, pero no anuncia cambios ni lleva foco al nuevo contenido (`client/src/pages/DashboardCoordinador.jsx:296-310,371-385`). | Eficiencia/accesibilidad: navegación confusa. | 2 | Región viva con página/resultados, foco opcional al título y URL/estado persistente. |

### 5.2.3 Síntesis según ISO 9241-11

| Dimensión | Fortalezas observables | Riesgos principales | Evidencia futura necesaria |
|---|---|---|---|
| Efectividad | Formularios usan controles nativos y `required`; detalle reúne datos, SLA e historial; RBAC existe en rutas de cliente y servidor. | **Riesgos de línea base:** estado/errores silenciosos, transiciones sin secuencia, contradicción del carné, etiqueta “Todos” incorrecta y acceso al detalle pendiente de revisión. Carné, transiciones y propiedad fueron corregidos posteriormente. | Éxito, completitud, errores críticos y comprensión por rol. |
| Eficiencia | Acciones rápidas, filtros por estado, prioridad calculada y paginación de tablas extensas. | Flujos fragmentados, sin búsqueda/orden en colas, vuelta dependiente del historial, tablas no móviles y exportaciones separadas. | Tiempo, pasos, reintentos y comparación móvil/escritorio. |
| Satisfacción | Lenguaje mayormente breve, superficies consistentes y encuesta posterior al caso. | Dependencia de `alert`, falta de certeza tras acciones, controles pequeños, semántica insuficiente y términos técnicos. | SEQ, SUS, confianza, carga percibida y entrevista cualitativa. |

No puede concluirse que el producto sea usable conforme a ISO 9241-11 sin medir estas dimensiones con usuarios representativos en el contexto declarado.

### 5.2.4 Auditoría preliminar WCAG 2.2 según POUR

La prioridad se expresa como **P0** bloqueo que debe resolverse antes de liberar, **P1** alta, **P2** media. El criterio indicado es el principal aplicable; la conformidad real requiere evaluar el producto renderizado y su contenido.

| POUR | Criterio WCAG 2.2 | Observación/evidencia | Prioridad | Remediación propuesta | Método de prueba |
|---|---|---|---|---|---|
| Perceptible | 1.1.1 Contenido no textual (A) | Emojis comunican buscar, alertar, prioridad, acciones y estrellas; pueden anunciarse de manera inconsistente (`client/src/pages/CrearTicket.jsx:89-103`; `client/src/pages/EncuestaTicket.jsx:67-80`). | P1 | Marcar decorativos con `aria-hidden`; dar nombre textual a iconos funcionales; opciones “1 de 5” a “5 de 5”. | Accessibility tree con NVDA/VoiceOver y revisión DOM. |
| Perceptible | 1.3.1 Información y relaciones (A) | Acordeones son `div`; modales no tienen `dialog`, título asociado ni agrupación; estrellas no usan `fieldset/legend` (`client/src/pages/PreguntasFrecuentes.jsx:243-281,290-318`; `client/src/pages/EncuestaTicket.jsx:63-81`). | P0 | Usar botones, encabezados, `aria-expanded/controls`, `dialog` accesible y grupo de radio con leyenda. | Teclado, Accessibility Inspector y pruebas unitarias de rol/nombre/estado. |
| Perceptible | 1.3.2 Secuencia significativa (A) | Grids y filas dependen de orden visual; al apilar deben conservar título, estado, descripción y acción. | P1 | Mantener orden DOM lógico y no reordenar con CSS sin necesidad. | Desactivar CSS, navegar lector de pantalla y revisar a 320 px. |
| Perceptible | 1.4.1 Uso del color (A) | Estado, prioridad, vencimiento y donut usan colores como señal destacada (`client/src/pages/DashboardCoordinador.jsx:226-250,279-285`; `client/src/pages/DetalleTicket.jsx:116-133`). | P0 | Añadir texto/iconografía/patrón; no retirar etiquetas visibles. | Escala de grises y simulación de deficiencias de color. |
| Perceptible | 1.4.3 Contraste mínimo (AA) | Textos `#aaa`, `#888` y controles coloreados sobre blanco pueden no alcanzar 4.5:1; amarillo `#f1c40f` con blanco es especialmente riesgoso (`client/src/pages/HistorialTickets.jsx:143-166`). | P0 | Medir tokens; oscurecer texto/amarillo o usar tinta oscura; conservar intención cromática. | axe + Contrast Analyser sobre estados reales. |
| Perceptible | 1.4.10 Reflow (AA) | Grids de 2/3 columnas y tablas sin wrapper responsive pueden desbordar; estilos de página no contienen media queries (`client/src/pages/DashboardAgente.jsx:266-294`; `client/src/pages/DashboardCoordinador.jsx:395-414`). | P0 | Base de una columna; breakpoints progresivos; tabla con adaptación semántica o scroll local identificado. | 320 CSS px y zoom 400 % sin scroll bidimensional de página. |
| Perceptible | 1.4.11 Contraste no textual (AA) | Bordes `#ddd`, indicadores y focos no definidos pueden ser insuficientes. | P1 | Bordes/estados de foco ≥ 3:1; token único de foco de 2 px con separación. | Medición de contraste y recorrido de teclado. |
| Perceptible | 1.4.12 Espaciado del texto (AA) | Alturas no suelen fijarse en texto, pero badges y encabezados compactos requieren prueba con espaciado aumentado. | P2 | Permitir crecimiento, wrapping y alturas automáticas. | Bookmarklet de text spacing de WCAG en todas las pantallas. |
| Operable | 2.1.1 Teclado (A) | Acordeones y artículos son `div onClick`; editor `contentEditable` y su selector personalizado requieren verificación (`client/src/pages/PreguntasFrecuentes.jsx:243-279`; `client/src/pages/GestionConocimiento.jsx:387-477`). | P0 | Sustituir por elementos semánticos; implementar teclado del editor y evitar trampas. | Solo teclado: Tab, Shift+Tab, Enter, Space, flechas y Escape. |
| Operable | 2.1.2 Sin trampas de teclado (A) | Modales no contienen ni restauran foco; overlays pueden cerrarlos (`client/src/components/CambiarPassword.jsx:34-85`). | P0 | Gestión completa de foco, Escape, botón cerrar con nombre y retorno al disparador. | Prueba manual con teclado y lector de pantalla. |
| Operable | 2.4.3 Orden del foco (A) | El contenido modal se inserta al final y no recibe foco inicial; tras cerrar no hay restauración explícita. | P1 | Foco inicial en título/control seguro, ciclo dentro del diálogo y restauración. | Registro secuencial del foco en cada modal. |
| Operable | 2.4.4 Propósito de enlaces (A) y 2.4.6 Encabezados/etiquetas (AA) | Repetidos “Ver”, “Ver detalle” y botones de flecha requieren contexto accesible; encabezados varían por estilos locales. | P1 | Nombre accesible “Ver ticket #ID”; jerarquía `h1-h3` coherente y etiquetas descriptivas. | Lista de controles/encabezados con lector de pantalla. |
| Operable | 2.4.7 Foco visible (AA) y 2.4.11 Foco no oculto (AA) | La mayoría de estilos en línea no define `:focus-visible`; headers o modales pueden ocultar el foco. | P0 | Estilo global visible, no recortado y contraste ≥ 3:1; asegurar visibilidad al abrir teclado. | Recorrido completo a teclado en cada breakpoint. |
| Operable | 2.5.3 Etiqueta en el nombre (A) | Los controles con texto suelen conservar nombre visible; iconos “×/✕” carecen de etiqueta textual (`client/src/components/CambiarPassword.jsx:37-40`). | P1 | `aria-label="Cerrar ..."` que incluya el propósito visible cuando corresponda. | Speech input conceptual y Accessibility tree. |
| Operable | 2.5.8 Tamaño del objetivo (mínimo) (AA) | Numerosos botones tienen padding de 4-8 px y fuente 12-13 px; pueden quedar por debajo de 24×24 CSS px (`client/src/pages/HistorialTickets.jsx:164-165`; `client/src/pages/GestionConocimiento.jsx:638-656`). | P1 | Mínimo WCAG 24×24; objetivo de diseño táctil 44×44 con separación de 8 px. | Medición en DevTools a 320/390 px. |
| Comprensible | 3.1.1 Idioma de la página (A) | `client/index.html` debe conservar/confirmar `lang="es"`; la interfaz está en español. | P1 | Definir `lang="es-GT"` si el contexto lingüístico se confirma. | Inspección DOM y pronunciación con lector. |
| Comprensible | 3.2.3 Navegación coherente (AA) | Encabezados y retorno cambian entre vistas; unas usan dashboard fijo y otras `navigate(-1)`. | P1 | App shell por rol, título de página, destino de retorno predecible y migas cuando aporten valor. | Recorrido comparativo por rol y tree test. |
| Comprensible | 3.3.1 Identificación de errores (A) y 3.3.3 Sugerencia (AA) | Errores se muestran como párrafo global o `alert`, sin asociación a campos (`client/src/pages/CrearTicket.jsx:27-35,119-140`). | P0 | Error junto al campo, resumen enfocable, `aria-describedby`, sugerencia y conservación de datos. | Enviar vacío/inválido con teclado y lector de pantalla. |
| Comprensible | 3.3.2 Etiquetas o instrucciones (A) | Etiquetas visibles existen, pero reglas como 10 caracteres o formato de carné no se anticipan. | P1 | Ayuda persistente antes de enviar; indicar obligatorios semánticamente. | Inspección y prueba de errores por campo. |
| Comprensible | 3.3.7 Entrada redundante (A) | Estudiante no vuelve a introducir su identidad; agente sí necesita carné, coherente con creación para terceros. | P2 | Autocompletar datos ya conocidos dentro del mismo proceso y permitir corregirlos. | Escenario repetido y revisión de almacenamiento. |
| Comprensible | 3.3.8 Autenticación accesible mínima (AA) | Login depende de contraseña, sin alternativa o ayuda visible (`client/src/pages/Login.jsx:33-63`). La aplicabilidad exacta requiere analizar la política institucional. | P1 | Permitir gestores de contraseña, pegar y revelar contraseña; ofrecer recuperación; no imponer pruebas cognitivas. | Gestor de contraseñas, pegado, zoom y revisión de política. |
| Robusto | 4.1.2 Nombre, función, valor (A) | Divs interactivos, editor y modales no exponen correctamente rol/estado/valor. | P0 | HTML nativo primero; ARIA solo para completar patrón; estados `expanded`, `selected`, `busy` y diálogo. | Accessibility tree, axe y NVDA/VoiceOver. |
| Robusto | 4.1.3 Mensajes de estado (AA) | Carga, éxito y error no se anuncian; algunos desaparecen por temporizador (`client/src/pages/GestionConocimiento.jsx:139-148,266-270`). | P1 | Regiones `status`/`alert`, `aria-busy`, persistencia suficiente y anuncio sin mover foco salvo error crítico. | Lector de pantalla durante solicitudes simuladas. |

### 5.2.5 Criterios de cierre de evaluación

Antes de considerar una versión candidata: no deben quedar hallazgos heurísticos de severidad 4; los de severidad 3 deben resolverse o aceptar su riesgo explícitamente; no debe existir bloqueo WCAG 2.2 A/AA en tareas críticas; y las métricas de 5.1.9 deben recogerse en al menos una ronda posterior a la corrección. Herramientas automáticas como axe o Lighthouse detectan solo una parte de los problemas y no sustituyen inspección manual ni participación de personas con discapacidad.

## 5.3 Mobile-first y Atomic Design

### 5.3.1 Diagnóstico inicial y principios

En la línea base, el código no podía calificarse como mobile-first: las páginas usaban objetos de estilos en línea que fijaban grids de dos o tres columnas, cabeceras horizontales y tablas sin media queries. El backlog sí declaraba la intención mobile-first y criterios para menos de 768 px (`docs/agile/backlog.md:13-18,238-266`). La remediación descrita en 5.3.10 incorpora tokens, reflow y wrappers de tabla para los flujos críticos, aunque todavía requiere validación manual en dispositivos y migración gradual de pantallas secundarias.

La propuesta parte de 320 px y añade capacidad, en lugar de reducir un escritorio fijo. Sus principios son: una tarea primaria por pantalla; contenido y acción antes que decoración; controles táctiles de 44×44 px como objetivo; ausencia de scroll horizontal de página; texto ampliable; estados no dependientes de color; progresión de una a varias columnas; y componentes compartidos con semántica accesible.

### 5.3.2 Breakpoints y rejilla

Los breakpoints responden al contenido, no a modelos específicos de dispositivo.

| Token | Intervalo | Rejilla y márgenes | Comportamiento |
|---|---:|---|---|
| `xs` | 320-479 px | 4 columnas, margen 16 px, gutter 12 px | Una columna; header compacto en dos filas si es necesario; acciones principales a ancho completo; tarjetas para datos tabulares. |
| `sm` | 480-767 px | 4 columnas, margen 20 px, gutter 16 px | Botones secundarios pueden compartir fila; filtros con scroll local o wrap; modal casi a pantalla completa. |
| `md` | 768-1023 px | 8 columnas, margen 24 px, gutter 20 px | Dos columnas solo si cada bloque conserva al menos 280 px; navegación y tablas simplificadas. |
| `lg` | 1024-1439 px | 12 columnas, margen 32 px, gutter 24 px, contenido máximo según flujo | KPI de 2-3 columnas; tabla completa; formulario mantiene ancho legible de 600-720 px. |
| `xl` | ≥ 1440 px | 12 columnas, margen 48 px, contenido máximo 1200 px | No estirar líneas ni tarjetas; usar espacio para resumen + detalle, no para aumentar densidad indiscriminadamente. |

Reglas transversales: `box-sizing: border-box`; imágenes/visualizaciones `max-width: 100%`; textos y valores largos con wrap; área principal centrada; espaciado base de 4 px con escala 4/8/12/16/24/32/48; y contenedores mediante CSS compartido, no duplicados en objetos por página. A 200 % de zoom, el comportamiento debe equivaler a un viewport estrecho sin perder contenido.

### 5.3.3 Identidad visual implementada

La iteración implementada unificó la identidad visual en tokens violetas, superficies claras y texto pizarra. Las combinaciones semánticas deben seguir validándose con contraste renderizado.

| Token | Valor implementado | Uso documentado |
|---|---|---|
| `color-brand` | `#5b21b6` | Marca violeta, encabezados y controles principales compartidos. |
| `color-brand-hover` | `#4c1d95` | Interacción hover/active de la marca. |
| `color-brand-soft` | `#ede9fe` | Fondos y énfasis violetas suaves. |
| `color-ink` | `#1e293b` | Texto y títulos principales. |
| `color-coordinator` | `#5b21b6` | Identidad de coordinación alineada con la marca compartida. |
| `color-canvas` | `#f1f5f9` | Fondo predominante de las vistas. |
| `color-surface` | `#ffffff` | Tarjetas, campos y botones secundarios. |
| `color-border` | `#64748b` | Controles y límites que requieren percepción clara. |
| `color-divider` | `#cbd5e1` | Separadores y bordes secundarios. |
| `color-danger` | `#b42318` | Errores y acciones destructivas, siempre acompañados por texto. |
| `color-success` | `#18703d` | Confirmaciones, siempre acompañadas por texto. |
| `color-focus` | `#2563eb` | Contorno global `:focus-visible` de 3 px. |
| `font-sans` | `system-ui, 'Segoe UI', Roboto, sans-serif` | Pila global definida en `client/src/index.css`. |

Los estados deben combinar texto e icono, y algunas combinaciones actuales requerirán tinta oscura en fondos amarillos o tonos semánticos más oscuros. “Preservar” significa mantener la identidad y rol cromático, no conservar una combinación que incumpla contraste.

### 5.3.4 Inventario Atomic Design

| Nivel | Componentes propuestos | Variantes/estados mínimos | Correspondencia actual |
|---|---|---|---|
| Átomos | `Text`, `Heading`, `Icon`, `Button`, `IconButton`, `Link`, `Label`, `Input`, `Textarea`, `Select`, `Badge`, `Spinner`, `Divider`, `Avatar`, `VisuallyHidden` | Default, hover, focus-visible, active, disabled, busy, error; tamaños táctiles. | Hoy se repiten botones, campos y badges en cada archivo, por ejemplo `client/src/pages/HistorialTickets.jsx:143-166`. |
| Moléculas | `FormField`, `PasswordField`, `SearchField`, `StatusBadge`, `PriorityBadge`, `InfoRow`, `FilterChip`, `Pagination`, `Toast`, `InlineAlert`, `RatingGroup`, `MetricCard`, `ArticleListItem` | Ayuda/error asociado, seleccionado, vacío, vencido, éxito; nombres accesibles. | `InfoRow` se duplica en dashboards y detalle (`client/src/pages/DashboardEstudiante.jsx:145-152`; `client/src/pages/DetalleTicket.jsx:224-231`). |
| Organismos | `AppHeader`, `RoleNavigation`, `TicketCard`, `TicketList`, `TicketSummary`, `TicketTimeline`, `TicketStateForm`, `KnowledgeAccordion`, `DataTable`, `ResponsiveDataList`, `ModalDialog`, `ExportMenu`, `MetricsPanel` | Carga, vacío, error, datos parciales; móvil/escritorio. | Tarjetas/listas se duplican en tres historiales; modales son implementaciones locales. |
| Plantillas | `AuthTemplate`, `DashboardTemplate`, `ListTemplate`, `FormTemplate`, `DetailTemplate`, `ManagementTemplate` | Una columna base; zonas opcionales; ancho de lectura/tabla. | Las páginas repiten fondo, header y contenedor en estilos en línea. |
| Páginas | Login; dashboards por rol; FAQ; crear/listar/detallar ticket; encuesta; gestión de conocimiento; altas de usuario. | Datos reales, errores HTTP, permisos y sesión expirada. | Rutas completas en `client/src/App.jsx:27-59`. |

El inventario funciona como arquitectura objetivo. La implementación comenzó con `FeedbackMessage` como átomo, `FormField` como molécula y clases compartidas para layout, formularios, foco y tablas. Los demás componentes deben extraerse gradualmente, evitando una reescritura completa sin pruebas de regresión.

### 5.3.5 Especificación responsive pantalla por pantalla

| Pantalla/flujo crítico | `xs`/`sm` | `md` | `lg`/`xl` | Estados y accesibilidad obligatorios |
|---|---|---|---|---|
| Login `/login` | Tarjeta sin sombra obligatoria, ancho disponible, padding 16-24; botón 100 %; teclado no tapa el campo/acción. | Tarjeta de 400 px centrada. | Igual, sin ampliar líneas. | Título `h1`, autocomplete `username/current-password`, mostrar contraseña, carga, error asociado y recuperación. |
| Dashboard estudiante | Header puede apilar título y sesión; acciones en lista 100 %; perfil y último ticket en una columna, priorizando último ticket. | Dos tarjetas si caben; acciones envueltas. | Dos columnas como hoy (`client/src/pages/DashboardEstudiante.jsx:154-190`). | Skeleton/carga, vacío y error separados; acciones con texto, sin emoji indispensable. |
| FAQ/autoservicio | Búsqueda en columna; categorías como botones de 44 px; modal en pantalla casi completa con footer fijo y cuerpo desplazable. | Buscador puede ser fila; contenido hasta 720 px. | Máximo 800 px actual. | Acordeón semántico, foco, Escape, resultados y pregunta “¿resolvió?”. |
| Crear ticket | Una columna; tipologías como radios/tarjetas apiladas o 2+1; ayuda visible; CTA fijo solo si no oculta contenido. | Tipologías en tres columnas; formulario ≤ 640 px. | Formulario centrado, sin espacio lateral funcional. | Validación por campo, sugerencias FAQ, prioridad textual, confirmación final con ID/SLA; carné textual para terceros. |
| Mis tickets/asignados | Chips con wrap o scroll local y selección visible; tarjeta apila ID, estado, prioridad, fecha y acción; botón de detalle 44 px. | Tarjeta en dos zonas; búsqueda/orden arriba. | Lista de 700-900 px o tabla opcional. | Carga/vacío/error, contador anunciado, filtros con `aria-pressed`, descripción sin truncar al zoom. |
| Detalle/atención | Encabezado de resumen; filas se apilan etiqueta/valor cuando el valor es largo; cambio de estado después del contexto; timeline vertical; CTA 100 %. | Resumen y atención pueden ocupar dos columnas; historial debajo. | Contenido 960 px: columna principal y panel de acción sticky con cuidado de foco. | Estado no cromático, fecha límite, autor en historial, transiciones válidas, confirmación de escalar/cerrar, éxito in situ. |
| Encuesta | Grupo de cinco opciones puede ser escala horizontal si cada una conserva 44 px; a 320 px usar botones compactos 44 px o lista verbal. | Tarjeta 500 px. | Igual. | Radios con “n de 5” y extremos “Muy mala/Muy buena”; error en contexto y confirmación no nativa. |
| Dashboard agente | Acciones y KPI en una columna; vencidos como tarjetas; prioridad primero. | KPI 2+1; listas debajo. | Tres KPI y tabla como mejora progresiva. | Definición de KPI, actualización/fecha, enlace desde vencido, paginación anunciada. |
| Dashboard coordinador | Resumen crítico primero; KPI apilados; satisfacción sin carrusel obligatorio; vencidos/agentes como tarjetas; exportar en menú. | Dos columnas; tablas reducidas o scroll local. | Rejilla de 2-3 columnas y tablas completas. | Periodo y definición, sin datos/error, enlaces al ticket, exportación con progreso y confirmación. |
| Gestión de conocimiento | Header en dos filas; filtro 100 %; artículos como tarjetas; editor modal de pantalla completa, toolbar con wrap. | Tabla simplificada o tarjetas; modal 90 %. | Tabla y modal de 600 px como base actual. | Semántica de editor, foco, borrado seguro, vista previa, éxito/error anunciado. |
| Crear estudiante/agente y contraseña | Una columna, tarjeta sin márgenes desperdiciados, botones apilados en 320 px. | Botones en fila; tarjeta 500 px. | Igual. | Reglas previas, autocomplete apropiado, errores por campo, confirmar antes de descartar y diálogo accesible. |

### 5.3.6 Guía de construcción del prototipo en Figma y FigJam

El recurso proporcionado es un **tablero FigJam externo**, adecuado para descubrimiento, recorridos, afinidad y navegación, pero no para mantener los frames interactivos finales: [CRM Soporte, tablero FigJam](https://www.figma.com/board/QPY3vITCHn3jSwwnKO8Eek/CRM-Soporte?node-id=0-1&t=HDb3VODI9prCUwkG-1). No se editó el tablero como parte de esta actualización documental. Los frames del prototipo deben transferirse a un archivo **Figma Design** separado y enlazarse desde el tablero. Este informe no afirma que el enlace sea público, esté completo o haya sido validado.

**Estructura recomendada del tablero FigJam**

1. Crear zonas `00 Alcance`, `01 Evidencia del repositorio`, `02 Contexto y personas`, `03 Journey maps`, `04 Arquitectura`, `05 Hallazgos`, `06 Priorización` y `07 Decisiones`.
2. Copiar las tres personas y recorridos como hipótesis, marcados “Pendiente de investigación”. Usar un color para evidencia y otro para supuestos.
3. Añadir cada hallazgo H/WCAG con vínculo a la ruta o archivo, severidad, responsable y decisión.
4. Mantener un registro fechado de decisiones para carné, transiciones, permisos y contenido de SLA.
5. Enlazar el archivo Figma Design y las sesiones de prueba; no colocar datos personales reales.

**Estructura recomendada del archivo Figma Design**

1. Páginas: `00 Cover interno`, `01 Foundations`, `02 Components`, `03 Patterns`, `04 Student`, `05 Agent`, `06 Coordinator`, `07 Prototype`, `08 Test notes`, `99 Archive`. La página interna no es una portada de este informe.
2. Definir variables de color, tipografía, espaciado, radio y elevación con los valores de 5.3.3; crear modos claros y semánticos antes de dibujar pantallas.
3. Construir átomos y moléculas con Auto Layout, propiedades de componente y variantes de todos los estados. No convertir texto en contornos.
4. Crear organismos con constraints y anchos mínimo/máximo. Probar cada componente a 320, 390, 768 y 1440 px antes de componer páginas.
5. Crear frames base `Mobile 360`, `Tablet 768`, `Desktop 1440`; añadir 320 como prueba de estrés, no como diseño alternativo independiente.
6. Incluir estados de carga, vacío, error, éxito, permiso denegado, sesión expirada y contenido largo. Los prototipos solo de “camino feliz” no son suficientes.
7. Nombrar capas y componentes por función (`TicketCard/State/Overdue`), establecer orden de tabulación, anotaciones de lector de pantalla y notas de comportamiento que Figma no simula.
8. Conectar flujos por rol con puntos de inicio separados. Usar overlays para diálogos, no para páginas completas; definir cierre, Escape conceptual y retorno de foco en las anotaciones.
9. Ejecutar revisión de contraste y de tamaño; después, prueba interna de teclado conceptual y walkthrough con desarrollo/backend antes de usuarios.
10. Tras cada ronda, versionar el prototipo, vincular hallazgos a componentes y actualizar la matriz de trazabilidad.

**Mapa de navegación y enlaces del prototipo**

```text
Público
└─ Login
   ├─ sesión inválida / recuperación
   ├─ Estudiante → Dashboard estudiante
   ├─ Agente → Dashboard agente
   └─ Coordinador → Dashboard coordinador

Estudiante
├─ FAQ → Buscar → Categoría → Artículo → Resolvió / Crear ticket
├─ Crear ticket → Sugerencias → Formulario → Confirmación → Detalle
├─ Mis tickets → Filtrar → Detalle
│  └─ Resuelto → Aceptar resolución → Encuesta → Confirmación
├─ Cambiar contraseña
└─ Cerrar sesión → Login

Agente
├─ Tickets asignados → Filtrar/ordenar → Detalle
│  ├─ Cambiar estado → Confirmación
│  └─ Escalar → Confirmar consecuencias → Resultado
├─ Historial → Detalle
├─ Crear ticket para estudiante → Confirmación
├─ Base de conocimiento → Buscar → Crear/Editar/Eliminar
├─ Altas de usuario (si permiso gerencial confirmado)
└─ Cambiar contraseña / Cerrar sesión

Coordinador
├─ Dashboard → KPI / Satisfacción
├─ SLA vencidos → Detalle de ticket → Cambiar estado
├─ Tickets abiertos o todos (según decisión) → Detalle
├─ Gestión de agentes → Editar especialidad → Confirmación
├─ Exportar → Formato/periodo → Descarga o error
├─ Base de conocimiento y altas
└─ Cambiar contraseña / Cerrar sesión
```

### 5.3.7 Matriz de trazabilidad

| Necesidad/persona | Requisito | Evidencia actual | Diseño/componente | Evaluación/criterio |
|---|---|---|---|---|
| Ana: resolver sin ticket | UX-R02 | FAQ y creación separadas (`DashboardEstudiante.jsx:69-83`) | `SearchField`, `KnowledgeAccordion`, sugerencias en `FormTemplate` | T2; éxito autoservicio, SEQ y navegación con teclado. |
| Ana: registrar con certeza | UX-R03, UX-R04 | **Línea base:** prioridad visible, sin confirmación y carné numérico. **Actual:** confirmación persistente y carné `9989-XX-XXXXX` normalizado por API. | `FormField`, `PriorityBadge`, página Confirmación | T3; ≥ 90 % éxito y recuerda ID/plazo. |
| Ana: seguir y cerrar | UX-R06, UX-R11 | Listado, detalle, aceptación y estrellas | `TicketCard`, `TicketTimeline`, `RatingGroup` | T4/T7; comprensión ≥ 90 %, WCAG 1.4.1 y 4.1.2. |
| Carlos: priorizar carga | UX-R06, UX-R07 | KPI y tabla vencidos (`DashboardAgente.jsx:93-178`) | `MetricsPanel`, `ResponsiveDataList` | T5; caso crítico en ≤ 30 s; reflow a 320 px. |
| Carlos: transición segura | UX-R05 | Selector sin secuencia (`DetalleTicket.jsx:136-176`) | `TicketStateForm`, `ModalDialog` | T5; 0 transiciones inválidas, error asociado. |
| Carlos: escalar con control | UX-R05, UX-R09 | Confirmación nativa y cambio a Abierto | `EscalationDialog`, `Toast` | T6; predice responsable/estado y completa sin error. |
| Marta: interpretar servicio | UX-R10 | KPI sin periodo/definición (`DashboardCoordinador.jsx:168-257`) | `MetricCard`, filtro de periodo | T8; interpretación correcta y SEQ ≥ 5.5. |
| Marta: actuar sobre vencidos | UX-R07, UX-R10 | Tabla sin enlace/adaptación (`DashboardCoordinador.jsx:259-315`) | `DataTable`/`ResponsiveDataList` | T8; abre caso crítico ≤ 45 s; WCAG 1.4.10. |
| Marta: gestionar/exportar | UX-R09, UX-R10 | Edición y descargas con errores en consola | `InlineEdit`, `ExportMenu`, `Toast` | T9/T10; éxito ≥ 85 %, feedback anunciado. |
| Todos: acceso coherente | UX-R01, UX-R08, UX-R09 | RBAC y múltiples patrones de feedback | `AppHeader`, `RoleNavigation`, `ModalDialog`, alertas | Matriz de permisos; teclado 100 %; WCAG A/AA sin bloqueos. |
| Todos: identidad consistente | UX-R12 | Paleta y fuente repetidas en estilos locales | Foundations/tokens y biblioteca Atomic | Revisión visual, contraste y regresión en breakpoints. |

### 5.3.8 Backlog UX priorizado

| Prioridad | ID | Trabajo | Valor/riesgo mitigado | Criterio de terminado |
|---:|---|---|---|---|
| Resuelto | UX-01 | Imponer transiciones de estado y significado de Cerrado en UI y API. | Evita corrupción del proceso y errores críticos H05/H12. | Implementado: secuencia estricta hasta `Resuelto`; `Cerrado` solo por aceptación del estudiante. |
| Resuelto | UX-02 | Unificar formato de carné entre campo y backend. | Evita identificar al estudiante incorrecto o bloquear creación. | Implementado: entrada `9989-XX-XXXXX`, validación y normalización compacta para consulta/almacenamiento. |
| P0 | UX-03 | Crear fundamentos y controles accesibles: foco, labels, error, botones, diálogo y regiones de estado. | Resuelve bloqueos WCAG transversales antes de replicarlos. | Componentes cumplen teclado, nombre/rol/estado, contraste y 44 px objetivo. |
| P0 | UX-04 | Implementar layout mobile-first para creación, detalle y dashboards; adaptar tablas. | Corrige reflow y habilita tareas móviles del backlog. | Sin overflow de página a 320 px/400 %; pruebas visuales en seis anchos. |
| P0 | UX-05 | Dar semántica y teclado a FAQ, artículos, modales y encuesta. | Elimina bloqueos para tecnología de asistencia. | T2/T7 completos con teclado, NVDA y VoiceOver; axe sin fallos críticos. |
| P1 | UX-06 | Añadir feedback uniforme de carga, vacío, error y éxito; tratar 401/403 globalmente. | Reduce reintentos y decisiones con datos falsamente vacíos. | Estados demostrables en Storybook/Figma y pruebas de respuestas HTTP. |
| P1 | UX-07 | Crear confirmación de ticket con ID, prioridad, fecha límite y acciones. | Aumenta certeza y reduce duplicados. | T3 alcanza umbral; doble clic no duplica. |
| P1 | UX-08 | Integrar autoservicio de conocimiento en creación. | Puede reducir demanda y acelera solución. | Sugerencias preservan formulario; se mide apertura/resolución sin recolectar texto sensible. |
| P1 | UX-09 | Rediseñar cola de agente: filtro activo, búsqueda, orden SLA y fecha límite. | Mejora eficiencia operacional. | T5 dentro de tiempo; filtros accesibles y persistentes. |
| P1 | UX-10 | Clarificar dashboard coordinador: periodos, definiciones, vencidos accionables y exportación con feedback. | Sustenta decisiones y reduce ambigüedad. | T8/T10 cumplen objetivos; móvil y escritorio verificados. |
| P1 | UX-11 | Corregir nombre/alcance de “Todos los tickets” y añadir filtros acordados. | Evita interpretación incorrecta de datos. | Etiqueta, endpoint y estado vacío coinciden; prueba de contenido. |
| P1 | UX-12 | Revisar autorización/propiedad del detalle y permisos de gestión de conocimiento. | Riesgo de privacidad y coherencia de rol detectado durante UX. | Decisión de seguridad aprobada y pruebas negativas por rol/propiedad. |
| P2 | UX-13 | Consolidar Atomic Design y eliminar duplicación gradual de cards, headers, badges e `InfoRow`. | Consistencia y menor costo de corrección. | Inventario implementado sin cambiar comportamiento no relacionado; regresión visual. |
| P2 | UX-14 | Mejorar editor de conocimiento y reemplazar `document.execCommand`. | Robustez, accesibilidad y mantenibilidad. | Editor soportado, semántico, con vista previa y pruebas de pegado/formato. |
| P2 | UX-15 | Instrumentar métricas de 5.1.9 con privacidad y ejecutar dos rondas. | Convierte hipótesis en evidencia. | Protocolo/consentimiento, muestra segmentada, informe y backlog reordenado. |

El orden P0-P2 expresa riesgo de experiencia y accesibilidad, no estimación técnica. Debe combinarse con seguridad, arquitectura y capacidad del equipo antes de comprometer una entrega.

### 5.3.9 Limitaciones y condiciones de validez

- El análisis se basa en archivos del repositorio y no en observación del sistema desplegado; no se verificaron base de datos, latencia, navegadores ni contenido real.
- No se realizaron entrevistas, pruebas de usabilidad, card sorting, tree testing ni mediciones SUS/SEQ. Personas, emociones, frecuencias y objetivos son hipótesis explícitas.
- No se ejecutaron herramientas de accesibilidad ni pruebas con tecnologías de asistencia; la matriz WCAG es preliminar y no declara conformidad A, AA o AAA.
- No se midieron contrastes de todas las combinaciones renderizadas ni tamaños finales, pues estilos, zoom, navegador y datos pueden alterar el resultado.
- ISO 9241-210 e ISO 9241-11 se utilizan como marco de proceso y medición; este documento no concede ni implica certificación ISO.
- El tablero enlazado es una referencia externa de FigJam. No se editó ni se inspeccionaron su contenido o permisos durante esta actualización; los prototipos interactivos deben residir en un archivo Figma Design enlazado.
- Algunas diferencias históricas de nomenclatura aún requieren decisión de producto. El formato de carné, su normalización, las transiciones de estado y la primera capa responsive ya están implementados y se documentan en 5.3.10.
- Las referencias de línea corresponden a la línea base examinada entre el 22 y el 23 de octubre de 2026 y pueden desplazarse tras las modificaciones; la ruta del archivo sigue siendo la referencia estable.

### 5.3.10 Evidencia de implementación posterior al diagnóstico

Las siguientes acciones se ejecutaron como primera iteración. Reducen riesgos concretos, pero no reemplazan las pruebas con usuarios, tecnologías de asistencia y dispositivos definidas en 5.1.9.

| Área | Mejora implementada | Evidencia en el repositorio | Estado de validación |
|---|---|---|---|
| Fundamentos visuales | Tokens compartidos que conservan `#1a1a2e`, `#6c3483`, `#f4f4f4`, tarjetas blancas y la pila `system-ui`, Segoe UI y Roboto. | `client/src/index.css` | Compilación y lint completados; falta regresión visual formal. |
| Mobile-first | Reflow de headers, acciones, grids de dos/tres columnas, formularios, tarjetas, detalle y encuesta; tablas operativas con scroll local identificado. | `client/src/index.css`; clases `crm-*` en dashboards y flujos de tickets. | Build completado; pendiente matriz manual 320/390/768/1024/1440 y zoom 400 %. |
| Atomic Design | Se añadieron un átomo de feedback y una molécula de campo; se centralizaron patrones de foco, controles y layouts. | `client/src/components/atoms/FeedbackMessage.jsx`; `client/src/components/molecules/FormField.jsx` | Usados en login, creación, encuesta y cambio de contraseña. |
| Autenticación y recuperación | Estado de envío en login, autocomplete, error anunciado, redirección correcta por rol y manejo global de sesión expirada. | `client/src/pages/Login.jsx`; `client/src/services/api.js`; `client/src/components/RutaProtegida.jsx` | Lint/build completados; pendiente prueba E2E de expiración. |
| Navegación y permisos | Ruta 404, salto al contenido, altas de usuario restringidas a Coordinador y retorno por rol corregido. | `client/src/App.jsx`; `client/src/pages/NoEncontrado.jsx` | Rutas compiladas; backend mantiene autorización. |
| Formularios | Labels asociados, ayuda anticipada, carné textual `9989-XX-XXXXX`, tipología con estado anunciado y confirmación persistente con ID. Para creación por soporte, la API valida la máscara y elimina guiones antes de buscar el carné compacto. | `client/src/pages/CrearTicket.jsx`; `server/src/controllers/ticket.controller.js` | Build completado; creación requiere prueba funcional por rol. |
| Tickets | Filtros con `aria-pressed`, objetivos táctiles, tarjetas móviles, nombres accesibles y continuidad de encuesta tras cerrar. | `HistorialTickets.jsx`; `TicketsAsignados.jsx`; `DetalleTicket.jsx` | Flujo compilado; pendiente recorrido real completo. |
| Estados y propiedad | Flujo estricto `Abierto → EnProceso → Pendiente → Resuelto` en API y UI. Agente/Coordinación no pueden establecer `Cerrado`; solo el Estudiante propietario cierra al aceptar desde `Resuelto`. El detalle y la encuesta validan propiedad/asignación. | `server/src/services/ticket.service.js`; `survey.service.js`; `ticket.controller.js`; `client/src/pages/DetalleTicket.jsx` | Sintaxis validada; pendiente matriz de integración negativa por rol. |
| Migraciones | Ejecutor de migraciones SQL numeradas con tabla de versiones, checksum, bloqueo asesor y transacción por archivo. El comando vigente es `npm run db:migrate` desde `server`. | `server/src/scripts/migrate.js`; `server/src/migrations/001_ticket_workflow.sql`; `server/package.json` | Código inspeccionado y sintaxis validada; pendiente prueba repetida sobre una base aislada. No se alteraron ni publicaron credenciales. |
| Asignación | Round Robin transaccional por coincidencia exacta de especialidad para tickets creados por Estudiante o Coordinador; autoasignación cuando crea un Agente; respaldo sin asignar si no existe candidato. | `server/src/services/ticket.service.js`; tabla `asignacion_cursor` de la migración 001. | Código inspeccionado; pendientes pruebas de integración y carga concurrente en el entorno objetivo. |
| Prioridad y SLA | El cambio de prioridad está limitado a Agente asignado o Coordinación y a `Abierto`, `EnProceso` o `Pendiente`; reinicia `FechaLimiteSLA` desde el cambio con 4/24/48 horas. | `PUT /api/tickets/:idTicket/prioridad`; `ticket.service.js`; `DetalleTicket.jsx`. | Código inspeccionado; pendientes prueba de integración y verificación horaria del despliegue. |
| Reasignación y escalamiento | Candidatos y reasignación solo operan en estados activos y exigen especialidad igual a la tipología. El Agente asignado o Coordinación puede reasignar; el Agente asignado puede escalar al Coordinador, que queda `Abierto`. | `GET /:idTicket/candidatos`; `PUT /:idTicket/asignacion`; `PUT /:idTicket/escalar`; `ticket.service.js`. | Restricciones verificadas por inspección estática; pendiente E2E por rol. |
| Chat persistente | Conversación de texto persistida, ordenada y autorizada para propietario, asignado y Coordinación. Admite hasta 4,000 caracteres; Cerrado conserva lectura y bloquea escritura. | `server/src/services/message.service.js`; `ticket-access.service.js`; `client/src/components/organisms/TicketChat.jsx`. | Código inspeccionado; pendiente E2E multiusuario y lector de pantalla. |
| Socket.IO | JWT en handshake, autorización antes de unir la sala, eventos cliente `ticket:join`/`ticket:leave` y servidor `ticket:message`/`ticket:updated`. Tras reasignación, escalamiento o cambio de estado, se refresca la membresía: sockets sin acceso abandonan la sala; el nuevo asignado debe entrar al detalle y unirse con autorización vigente. | `server/src/realtime.js`; `client/src/services/socket.js`; `TicketChat.jsx`; `ticket.service.js`. | Código inspeccionado; pendientes pruebas de integración, autorización de salas y reconexión en red degradada. |
| Paginación | Tamaño 15 para colas, historiales por rol, vencidos, agentes y conocimiento; tamaño 25 para la vista global de Coordinación. Componente compartido con estado anunciado. | `Pagination.jsx`; constantes `PAGE_SIZE` de las páginas correspondientes. | Lint/build completados; pendiente prueba de foco con conjuntos extensos. |
| Reportes | Todos los endpoints de reporte son exclusivos de Coordinación. `GET /api/metricas/tickets` devuelve JSON; CSV/Excel de tickets incluyen ID, tipología, prioridad, estado, fechas, solución, estado SLA, agente y estudiante; el Excel de calificaciones incluye agente, promedio 1-5 y porcentaje. | `server/src/routes/metrics.route.js`; `metrics.controller.js`; `metrics.service.js`. | Generación cubierta por el flujo del servidor; pendiente inspección con datos representativos y lectores de hoja de cálculo. |
| Gestión de agentes | Vista responsive con creación, edición accesible de especialidad, feedback y bienvenida una vez por sesión del navegador mediante `sessionStorage`. | `client/src/pages/GestionAgentes.jsx`. | Lint/build completados; pendiente E2E del ciclo de sesión. |
| Conocimiento | Búsqueda y presentación agrupada por categoría, con grupo `General` como respaldo; tabla para escritorio y tarjetas agrupadas para viewport estrecho. | `client/src/pages/GestionConocimiento.jsx`; `PreguntasFrecuentes.jsx`. | Lint/build completados; pendiente validación con contenido largo. |
| Encuesta | Escala con nombre “n de 5”, estado seleccionado, error contextual y confirmación no nativa. | `client/src/pages/EncuestaTicket.jsx` | Lint/build completados; pendiente lector de pantalla. |
| Diálogos y FAQ | Diálogo de contraseña con foco, Escape y restauración; acordeones FAQ nativos, modal accesible y contenido sanitizado. | `client/src/components/CambiarPassword.jsx`; `client/src/pages/PreguntasFrecuentes.jsx` | Lint/build completados; pendiente NVDA/VoiceOver. |
| Seguridad de contenido | Sanitización en servidor al crear/editar conocimiento y DOMPurify al presentar artículos existentes. | `server/src/services/conocimiento.service.js`; `client/src/pages/PreguntasFrecuentes.jsx` | Prueba de sanitización del servidor completada. |
| Inicialización | Semillas corregidas para IDs PostgreSQL y ejecución repetible; `.env.example` alineado con variables reales. | `server/src/scripts/seed*.js`; `server/.env.example` | Esquema y semillas ejecutados correctamente contra Neon. |

**Deuda restante prioritaria.** Continúan pendientes la evaluación con usuarios, pruebas NVDA/VoiceOver, medición completa de contrastes, adaptación avanzada del editor de conocimiento, sustitución de `document.execCommand`, feedback uniforme en todas las pantallas secundarias, automatización E2E y evidencia visual en los breakpoints. Por ello no se declara conformidad WCAG 2.2 AA ni cumplimiento certificado de ISO 9241-210/11. El tablero FigJam permanece como referencia externa y no fue editado durante esta implementación o actualización documental.
