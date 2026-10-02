# Product Backlog — Sistema de Soporte UMG

**Proyecto:** Sistema de Gestión de Tickets de Soporte (UMG)  
**Curso:** Análisis de Sistemas I  
**Repositorio:** [https://github.com/serigio04/umg-soporte-crm](https://github.com/serigio04/umg-soporte-crm)  
**Ubicación del Documento:** `docs/agile/backlog.md`  
**Tablero Ágil Activo (Jira / GitHub Projects):** [Tablero de JIRA](https://miumg-soporte-crm.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog)  

---

## 1. Estructura Jerárquica: Épicas y Alcance del MVP

El desarrollo del **Sistema de Soporte UMG** se organiza jerárquicamente en dos Épicas principales orientadas a resolver la arquitectura de servicios REST para consumo omnicanal/interno y la experiencia de usuario responsive adaptada a dispositivos móviles:

* **ÉPICA 1: Desarrollo de APIs para Consumo Externo e Interno (Backend)**
  Agrupa el diseño, construcción y publicación de endpoints RESTful seguros, estandarizados y de alta disponibilidad para la gestión del ciclo de vida de tickets, captura omnicanal y extracción de métricas gerenciales.
* **ÉPICA 2: Desarrollo de Aplicación Web Responsive Enfocada a Dispositivos Móviles (Frontend)**
  Agrupa la implementación de la interfaz de usuario en React bajo la filosofía *Mobile-First*, optimizando la usabilidad en pantallas táctiles y garantizando flujos ágiles para estudiantes, agentes y coordinadores.

---

## 2. Reglas de Negocio (RN)

Las Historias de Usuario están condicionadas por las siguientes reglas de negocio explícitas del dominio UMG:

* **RN01 — Tipologías ITIL y Tiempos SLA:**
  * **Incidente:** Prioridad Alta — Tiempo límite de resolución: **4 horas**.
  * **Solicitud:** Prioridad Media — Tiempo límite de resolución: **24 horas**.
  * **Cambio:** Prioridad Baja — Tiempo límite de resolución: **48 horas**.
* **RN02 — Flujo de Estados:**
  * Secuencia obligatoria: `Abierto` → `EnProceso` → `Pendiente` → `Resuelto` → `Cerrado`.
  * Toda transición registra fecha, autor y comentario técnico en el historial inmutable.
* **RN03 — Inmutabilidad de Tickets Cerrados:** Un ticket en estado `Cerrado` queda completamente bloqueado para modificaciones tanto en backend como en frontend.
* **RN04 — Asignación Automática por Especialidad Fija:**
  * Cada agente tiene una especialidad fija (`Incidente`, `Solicitud` o `Cambio`).
  * Al crear un ticket, el sistema busca un agente con la misma especialidad y se lo asigna. Si no hay agente disponible, asigna `NULL`.
* **RN05 — Escalamiento Exclusivo a Coordinador:**
  * Únicamente un Agente puede escalar un ticket activo a un Coordinador (`NivelAcceso >= 3`).
  * Se cambia automáticamente el `IdAgente` al del Coordinador y se agrega un comentario técnico automático de auditoría.
* **RN06 — Identificación de Estudiantes por Carné:** Para la creación de tickets desde agentes o coordinadores a nombre de terceros, se requiere el carné universitario en formato `9989-XX-XXXXX`.
* **RN07 — Autenticación y Autorización (RBAC):**
  * Autenticación basada en JSON Web Tokens (JWT) con vigencia de **8 horas**.
  * Restricción por rol: endpoints y pantallas de métricas exclusivos para Coordinadores (`NivelAcceso >= 3`); cambio de estado restringido a Agentes y Coordinadores.
* **RN08 — Búsqueda en Base de Conocimientos (Self-Service):**
  * Sugerencia dinámica de artículos de ayuda o preguntas frecuentes (FAQ) previo a la creación del ticket para fomentar la solución de autoservicio.

---

## 3. Matriz del Product Backlog Priorizado

* **Prioridad (MoSCoW):** Must Have, Should Have, Could Have, Won't Have.
* **Estimación:** Story Points basados en la serie de Fibonacci (1, 2, 3, 5, 8, 13).

### ÉPICA 1: Desarrollo de APIs para Consumo Externo (Backend)

| ID Jira | Título / Servicio | Historia de Usuario (Como... Quiero... Para...) | Requerimiento / Endpoint | Reglas de Negocio | Prioridad | Story Points |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **SCRUM-2** | Creación de Ticket | Como sistema externo o formulario web, quiero registrar una solicitud vía HTTP POST, para crear un ticket con prioridad y SLA asignado. | `POST /api/tickets` | RN01, RN04, RN06 | Must Have | 5 |
| **SCRUM-7** | Atención y Resolución | Como agente de soporte, quiero actualizar el estado y agregar comentarios técnicos a un ticket, para dar seguimiento al caso. | `PUT /api/tickets/{id}/estado` | RN02, RN03, RN07 | Must Have | 5 |
| **SCRUM-8** | Consulta de Detalle | Como usuario o bot externo, quiero obtener el estado, historial y tiempo restante del SLA de un ticket, para realizar el seguimiento del caso. | `GET /api/tickets/{id}` | RN01, RN02 | Must Have | 3 |
| **SCRUM-9** | Métricas por Agente | Como coordinador de soporte, quiero consultar el total de tickets abiertos, resueltos y MTTR por agente, para evaluar el desempeño. | `GET /api/dashboard/metricas/agentes` | RN07 | Must Have | 5 |
| **SCRUM-10** | Métricas de Clasificación | Como coordinador de soporte, quiero consultar la cantidad de tickets por tipo de clasificación, para identificar las áreas con mayor demanda. | `GET /api/dashboard/metricas/tickets/clasificacion` | RN01, RN07 | Must Have | 3 |
| **SCRUM-11** | Seguridad y Manejo de Errores | Como arquitecto de software, quiero implementar autenticación JWT de 8h y respuestas de error estandarizadas, para proteger la API y asegurar la estabilidad. | Middleware Transversal JWT | RN07 | Must Have | 5 |

### ÉPICA 2: Aplicación Web Responsive Enfocada a Dispositivos Móviles (Frontend)

| ID Jira | Título / Pantalla | Historia de Usuario (Como... Quiero... Para...) | Requerimiento / Pantalla | Reglas de Negocio | Prioridad | Story Points |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **SCRUM-3** | Formulario Responsive de Creación | Como usuario (estudiante/agente/coordinador), quiero un formulario web adaptado a pantallas táctiles, para reportar incidentes o solicitudes desde móviles. | Formulario Creación (Todos) | RN01, RN04, RN06 | Must Have | 5 |
| **SCRUM-12** | Detalle y Atención de Ticket Móvil | Como agente o coordinador, quiero consultar el historial y actualizar el estado de los tickets desde una vista responsive, para atender casos desde mi smartphone. | Detalle de Ticket (Agente/Coord) | RN02, RN03, RN05, RN07 | Must Have | 8 |
| **SCRUM-13** | Agregar Artículo de Soporte | Como coordinador de soporte, quiero redactar y categorizar artículos para la base de conocimientos desde una vista móvil, para mantener actualizada la ayuda. | Agregar Artículo KB (Coordinador) | RN07, RN08 | Should Have | 3 |
| **SCRUM-14** | Búsqueda Previa en KB | Como estudiante, quiero consultar preguntas frecuentes sugeridas antes de enviar un ticket, para resolver mi duda de forma inmediata. | Integración KB + Formulario | RN08 | Should Have | 5 |
| **SCRUM-15** | Dashboard Gerencial Responsive | Como coordinador, quiero visualizar las métricas clave (MTTR, % resolución) en tarjetas táctiles adaptables, para monitorear el servicio desde móviles. | Dashboard Gerencial (Coordinador) | RN07 | Should Have | 5 |

---

## 4. Especificación Detallada de Historias de Usuario (Gherkin Format)

### ÉPICA 1: Desarrollo de APIs para Consumo Externo (Backend)

#### **SCRUM-2: Creación de Ticket vía API REST**
* **Prioridad:** Must Have | **Estimación:** 5 Story Points | **Módulo:** Backend / Tickets
* **Descripción:** Como sistema externo o cliente web, quiero enviar los datos de una solicitud vía HTTP POST a `/api/tickets`, para registrar un ticket y asignarle automáticamente su SLA.
* **Reglas de Negocio:** RN01, RN04, RN06

##### Criterios de Aceptación:

```gherkin
Scenario: Creación exitosa de ticket con asignación de SLA
  Given que se recibe una petición HTTP POST en el endpoint "/api/tickets"
  And el cuerpo JSON contiene los campos requeridos "idEstudiante", "asunto" y "canalOrigen"
  When el sistema procesa la solicitud de creación
  Then responde con un código de estado HTTP 201 Created
  And devuelve un objeto JSON con el "idTicket" generado y la "prioridadSLA" asignada automáticamente
  And registra el ticket asignando un agente según la especialidad coincidente o NULL si no hay disponibilidad

Scenario: Error por campos requeridos faltantes en la creación
  Given que se recibe una petición HTTP POST en "/api/tickets"
  And el cuerpo JSON no incluye alguno de los campos requeridos ("asunto", "canalOrigen" o "idEstudiante")
  When el sistema valida la entrada de datos
  Then responde con un código de estado HTTP 400 Bad Request
  And devuelve el mensaje de error con la estructura JSON {"message": "descripción del error"}
```

#### **SCRUM-7: Resolución / Atención de Ticket**
* **Prioridad:** Must Have | **Estimación:** 5 Story Points | **Módulo:** Backend / Atenciones
* **Descripción:** Como agente de soporte, quiero actualizar el estado y agregar comentarios técnicos a un ticket mediante `PUT /api/tickets/{idTicket}/estado`, para dar seguimiento a la resolución del caso.
* **Reglas de Negocio:** RN02, RN03, RN07

##### Criterios de Aceptación:

```gherkin
Scenario: Actualización exitosa del estado de un ticket activo
  Given un "idTicket" existente enviado como parámetro en la URL
  And un token JWT válido perteneciente a un usuario con rol "Agente" o "Coordinador"
  And un cuerpo JSON que contiene "estado" válido y "comentarioTecnico"
  When se ejecuta la petición HTTP PUT a "/api/tickets/{idTicket}/estado"
  Then el sistema actualiza el estado del ticket en la base de datos
  And genera un registro inmutable en el historial con fecha, autor y comentario técnico
  And responde con un código de estado HTTP 200 OK

Scenario: Intento de modificación en un ticket en estado Cerrado
  Given un "idTicket" existente cuyo estado actual es "Cerrado"
  When un agente intenta enviar una petición HTTP PUT a "/api/tickets/{idTicket}/estado"
  Then el sistema bloquea la operación impidiendo cualquier cambio
  And responde con un código de estado HTTP 400 Bad Request
  And devuelve la respuesta JSON {"message": "Un ticket cerrado no puede ser modificado"}

Scenario: Ticket no encontrado para actualización
  Given un "idTicket" con un id inexistente en la base de datos
  When se realiza la petición HTTP PUT a "/api/tickets/{idTicket}/estado"
  Then el sistema responde con un código de estado HTTP 404 Not Found
  And devuelve la estructura JSON {"message": "Ticket no encontrado"}
```

---

#### **SCRUM-8: Consulta de Detalle de Ticket**
* **Prioridad:** Must Have | **Estimación:** 3 Story Points | **Módulo:** Backend / Tracking
* **Descripción:** Como consumidor externo o portal web, quiero consultar `GET /api/tickets/{idTicket}`, para obtener el estado actual, horas restantes del SLA y el historial de cambios.
* **Reglas de Negocio:** RN01, RN02

##### Criterios de Aceptación:

```gherkin
Scenario: Consulta exitosa de un ticket existente
  Given un "idTicket" válido registrado en el sistema
  When se realiza una petición HTTP GET a "/api/tickets/{idTicket}"
  Then el sistema responde con un código de estado HTTP 200 OK
  And devuelve el objeto JSON que incluye "idTicket", "asunto", "estado", "prioridadSLA", "canalOrigen", "horasRestantes", "vencido" e "historial"

Scenario: Consulta de ticket inexistente
  Given un "idTicket" que no existe en el sistema
  When se efectúa la petición HTTP GET a "/api/tickets/{idTicket}"
  Then el sistema responde con un código de estado HTTP 404 Not Found
  And retorna la estructura de error estandarizada {"message": "Ticket no encontrado"}
```

---

#### **SCRUM-9: Métricas del Dashboard por Agente**
* **Prioridad:** Must Have | **Estimación:** 5 Story Points | **Módulo:** Backend / Dashboard
* **Descripción:** Como coordinador de soporte, quiero consultar `GET /api/dashboard/metricas/agentes` incluyendo mi token JWT, para visualizar los totales de tickets abiertos, resueltos y el MTTR por agente.
* **Reglas de Negocio:** RN07

##### Criterios de Aceptación:

```gherkin
Scenario: Consulta autorizada de métricas por un Coordinador
  Given un token Bearer JWT válido enviado en el Header "Authorization"
  And el token pertenece a un usuario con rol "Coordinador" (NivelAcceso >= 3)
  When se realiza una petición HTTP GET a "/api/dashboard/metricas/agentes"
  Then el sistema responde con un código de estado HTTP 200 OK
  And devuelve el objeto JSON con "totalAbiertos", "totalResueltos" y el "MTTR" agrupado por agente

Scenario: Acceso denegado a un usuario sin permisos de Coordinación
  Given un token Bearer JWT válido enviado en el Header "Authorization"
  And el token pertenece a un usuario con rol "Estudiante" o "Agente"
  When se solicita el endpoint HTTP GET "/api/dashboard/metricas/agentes"
  Then el sistema rechaza la petición
  And responde con un código de estado HTTP 403 Forbidden
  And devuelve la respuesta {"message": "Acceso no autorizado para este recurso"}

Scenario: Error por falta de autenticación
  Given que no se envía la cabecera "Authorization" o el token está expirado
  When se realiza la petición a "/api/dashboard/metricas/agentes"
  Then el sistema responde con un código de estado HTTP 401 Unauthorized
```

---

#### **SCRUM-10: Métricas del Dashboard de Clasificación de Tickets**
* **Prioridad:** Must Have | **Estimación:** 3 Story Points | **Módulo:** Backend / Dashboard
* **Descripción:** Como coordinador de soporte, quiero consultar `GET /api/dashboard/metricas/tickets/clasificacion`, para obtener la cantidad de tickets categorizados por tipo (Incidente, Solicitud, Cambio).
* **Reglas de Negocio:** RN01, RN07

##### Criterios de Aceptación:

```gherkin
Scenario: Obtención de clasificación exitosa por el Coordinador
  Given un token Bearer JWT válido correspondiente a un usuario Coordinador
  When se efectúa la petición HTTP GET a "/api/dashboard/metricas/tickets/clasificacion"
  Then el sistema responde con un código de estado HTTP 200 OK
  And devuelve el objeto JSON con la clasificación de tickets y sus correspondientes cantidades

Scenario: Rechazo por credenciales ausentes o no autorizadas
  Given que el token no pertenece a un rol con "NivelAcceso >= 3"
  When se envía la petición HTTP GET a "/api/dashboard/metricas/tickets/clasificacion"
  Then el sistema responde con un código de estado HTTP 403 Forbidden
```

---

#### **SCRUM-11: Seguridad Transversal y Manejo Estandarizado de Errores**
* **Prioridad:** Must Have | **Estimación:** 5 Story Points | **Módulo:** Backend / Core Security
* **Descripción:** Como arquitecto de software, quiero implementar un middleware de autenticación JWT y un manejador global de excepciones, para proteger la API y asegurar respuestas consistentes.
* **Reglas de Negocio:** RN07

##### Criterios de Aceptación:

```gherkin
Scenario: Validación de token con tiempo de expiración
  Given un token JWT expedido hace más de 8 horas
  When el cliente realiza cualquier petición a un endpoint protegido
  Then el middleware invalida la sesión
  And responde con un código de estado HTTP 401 Unauthorized

Scenario: Ocultamiento de detalles de servidor en errores 500
  Given una excepción interna no controlada en el servidor o base de datos
  When el cliente ejecuta una solicitud a la API
  Then el sistema captura la excepción globalmente
  And responde con un código de estado HTTP 500 Internal Server Error
  And la respuesta devuelve exclusivamente {"message": "Error interno del servidor"} sin exponer stack traces
```

---

### ÉPICA 2: Aplicación Web Responsive Enfocada a Dispositivos Móviles (Frontend)

#### **SCRUM-12: Formulario Responsive de Creación de Ticket**
* **Pantalla:** Formulario de Creación de Ticket (**Todos los Roles**)
* **Prioridad:** Must Have | **Estimación:** 5 Story Points | **Módulo:** Frontend / UI
* **Descripción:** Como usuario, quiero llenar un formulario adaptable a pantallas de smartphone, para registrar solicitudes de forma cómoda desde mi dispositivo móvil.
* **Reglas de Negocio:** RN01, RN04, RN06

##### Criterios de Aceptación:

```gherkin
Scenario: Despliegue responsive en dispositivos móviles
  Given que un usuario accede al formulario desde un dispositivo con ancho de pantalla menor a 768px
  When la pantalla termina de cargar
  Then los elementos del formulario se organizan en un diseño fluido de una sola columna
  And los campos de texto e insumos de selección cumplen con el tamaño táctil mínimo recomendado

Scenario: Creación de ticket por un Estudiante
  Given un usuario autenticado con el rol "Estudiante"
  When navega a la pantalla de creación de ticket
  Then el sistema asocia automáticamente su identificador interno sin solicitar carné
  And al enviar el formulario muestra una notificación emergente (toast) confirmando el número de ticket y tiempo SLA

Scenario: Creación a nombre de un estudiante por Agente o Coordinador
  Given un usuario autenticado con rol "Agente" o "Coordinador"
  When carga el formulario de creación de ticket
  Then se despliega un campo de texto obligatorio para ingresar el "carné del estudiante"
  And el sistema valida que el formato cumpla con la máscara universitaria "9989-XX-XXXXX" (RN06)
```

---

#### **SCRUM-13: Vista Responsive de Detalle de Ticket y Atenciones**
* **Pantalla:** Detalle de Ticket (**Coordinador y Agente**)
* **Prioridad:** Must Have | **Estimación:** 8 Story Points | **Módulo:** Frontend / Atenciones
* **Descripción:** Como agente o coordinador, quiero consultar el historial, cambiar de estado y escalar tickets desde una interfaz móvil, para gestionar atenciones desde smartphones.
* **Reglas de Negocio:** RN02, RN03, RN05, RN07

##### Criterios de Aceptación:

```gherkin
Scenario: Adaptación del historial en vista móvil
  Given un Agente abriendo el detalle de un ticket en un dispositivo móvil
  When observa el historial de cambios y atenciones
  Then la línea de tiempo (timeline) se renderiza en formato vertical adaptable
  And la información de fecha, autor y observaciones no requiere desplazamiento horizontal

Scenario: Escalamiento exitoso a Coordinación
  Given un Agente autenticado en el detalle de un ticket en estado "EnProceso"
  When presiona el botón "Escalar a Coordinador"
  Then el sistema ejecuta la solicitud de cambio de asignación al Coordinador
  And registra automáticamente un comentario de auditoría en la línea de tiempo
  And actualiza la pantalla mostrando al nuevo responsable

Scenario: Bloqueo de controles en tickets cerrados
  Given que el ticket consultado se encuentra en estado "Cerrado"
  When la pantalla de detalle finaliza su renderizado
  Then el formulario de cambio de estado y la caja de texto para comentarios permanecen inhabilitados (RN03)
```

---

#### **SCRUM-14: Formulario para Agregar Artículos a la Base de Conocimientos**
* **Pantalla:** Agregar Artículo de Soporte (**Coordinador**)
* **Prioridad:** Should Have | **Estimación:** 3 Story Points | **Módulo:** Frontend / KB
* **Descripción:** Como coordinador de soporte, quiero redactar y categorizar nuevos artículos desde una pantalla móvil, para mantener actualizada la Base de Conocimientos.
* **Reglas de Negocio:** RN07, RN08

##### Criterios de Aceptación:

```gherkin
Scenario: Creación exitosa de artículo por el Coordinador
  Given un usuario autenticado con rol "Coordinador"
  When ingresa Título, Categoría, Tags y Contenido en la pantalla de gestión de KB
  And presiona el botón "Guardar Artículo"
  Then la aplicación envía los datos al backend y confirma la publicación mediante una alerta

Scenario: Restricción de acceso a usuarios sin rol de Coordinador
  Given un usuario autenticado con rol "Estudiante" o "Agente"
  When intenta acceder mediante la ruta directa de la pantalla "/kb/crear"
  Then el enrutador de la aplicación intercepta la navegación
  And redirige al usuario a su panel principal denegando el acceso
```

---

#### **SCRUM-15: Flujo de Consulta Previa en Base de Conocimientos**
* **Pantalla:** Búsqueda e Integración KB (**Estudiante**)
* **Prioridad:** Should Have | **Estimación:** 5 Story Points | **Módulo:** Frontend / Self-Service
* **Descripción:** Como estudiante, quiero realizar búsquedas en la Base de Conocimientos antes de abrir un ticket, para intentar resolver mi inquietud inmediatamente.
* **Reglas de Negocio:** RN08

##### Criterios de Aceptación:

```gherkin
Scenario: Sugerencia dinámica de artículos al redactar el asunto
  Given un estudiante en el formulario de creación de ticket
  When escribe términos clave en el campo "Asunto"
  Then el sistema consulta en tiempo real y despliega un listado de preguntas frecuentes sugeridas

Scenario: Autoservicio exitoso cancela creación de ticket
  Given que el listado desplegado muestra un artículo relevante para el estudiante
  When el estudiante selecciona el artículo y hace clic en "Resolvió mi duda"
  Then la aplicación cancela la creación del ticket sin enviar registros al servidor
  And regresa al estudiante a la pantalla de inicio
```

---

#### **SCRUM-16: Dashboard Gerencial Móvil**
* **Pantalla:** Dashboard Gerencial (**Coordinador / Agente**)
* **Prioridad:** Should Have | **Estimación:** 5 Story Points | **Módulo:** Frontend / Dashboard
* **Descripción:** Como coordinador, quiero visualizar las métricas clave (MTTR, % de resolución, estado de SLA) organizadas en tarjetas responsivas, para monitorear el servicio desde móviles.
* **Reglas de Negocio:** RN07

##### Criterios de Aceptación:

```gherkin
Scenario: Visualización de métricas en formato móvil
  Given un Coordinador consultando la pantalla de Dashboard desde un smartphone
  When los datos de rendimiento son cargados
  Then las métricas clave se presentan apiladas en tarjetas táctiles (KPI Cards)
  And los gráficos de distribución se escalan sin desbordar el ancho de la pantalla

Scenario: Alerta visual para tickets con SLA vencido
  Given el listado de métricas de cumplimiento de SLA
  When existen tickets que sobrepasaron el tiempo límite estipulado (4h, 24h o 48h)
  Then la interfaz destaca dichos registros con indicadores visuales de color rojo y etiqueta de "Vencido"
```

---

## 5. Plan de Entregas y Estimación por Sprints (Sprint Backlog)

### Sprint 1: MVP Core (APIs de Operación + Vistas Móviles Principales)
* **SCRUM-6:** Creación de Ticket vía API (5 SP)
* **SCRUM-7:** Atención y Resolución de Ticket (5 SP)
* **SCRUM-8:** Consulta de Detalle e Historial (3 SP)
* **SCRUM-11:** Seguridad Transversal JWT y Errores (5 SP)
* **SCRUM-12:** Formulario Responsive de Creación (5 SP)
* **SCRUM-13:** Detalle y Atención de Ticket Móvil (8 SP)
* **Total Story Points Sprint 1:** **31 SP**

### Sprint 2: Métricas Gerenciales, Base de Conocimientos y Autoservicio
* **SCRUM-9:** Métricas Dashboard por Agente (5 SP)
* **SCRUM-10:** Métricas Dashboard de Clasificación (3 SP)
* **SCRUM-14:** Formulario Agregar Artículo KB (3 SP)
* **SCRUM-15:** Flujo de Consulta Previa KB (5 SP)
* **SCRUM-16:** Dashboard Gerencial Responsive (5 SP)
* **Total Story Points Sprint 2:** **21 SP**