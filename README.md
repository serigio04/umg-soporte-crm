# Sistema de Soporte UMG

Aplicación web para administrar solicitudes de soporte de estudiantes de la Universidad Mariano Gálvez. Permite registrar y dar seguimiento a tickets, atenderlos según su tipología y especialidad, consultar la base de conocimiento y supervisar métricas de soporte.

## Funcionalidades

- Acceso para estudiantes, agentes y coordinadores mediante autenticación JWT.
- Creación y seguimiento de tickets con prioridad y SLA iniciales por tipología: Incidente/Alta/4 horas, Solicitud/Media/24 horas y Cambio/Baja/48 horas.
- Asignación automática Round Robin transaccional entre agentes cuya especialidad coincide exactamente con la tipología. Si no existe un agente compatible, el ticket queda sin asignar; cuando un Agente crea un ticket, se autoasigna el caso.
- Atención con flujo estricto `Abierto → EnProceso → Pendiente → Resuelto`, historial, cambio de prioridad, reasignación compatible y escalamiento. Solo el Estudiante propietario puede convertir `Resuelto` en `Cerrado` al aceptar la solución.
- Chat de texto persistente por ticket entre participantes autorizados, con mensajes y cambios en tiempo real mediante Socket.IO. Al cerrar el ticket, la conversación permanece visible en modo de solo lectura.
- Base de conocimiento y preguntas frecuentes agrupadas por categoría.
- Paneles por rol, métricas, gestión de agentes y descarga de reportes CSV/Excel.
- Encuestas de satisfacción posteriores a la resolución.

## Tecnologías

- **Frontend:** React, Vite, React Router, Axios y Socket.IO Client.
- **Backend:** Node.js, Express, JSON Web Tokens y Socket.IO.
- **Base de datos:** PostgreSQL, compatible con Neon.

## Requisitos

- Node.js 20.19+ o 22.12+, con npm.
- Una base de datos PostgreSQL accesible.
- Git.

## Instalación y ejecución

### 1. Obtener el proyecto

```bash
git clone https://github.com/serigio04/umg-soporte-crm.git
cd umg-soporte-crm
```

### 2. Configurar el servidor

Instala sus dependencias desde la carpeta `server`:

```bash
cd server
npm install
```

Crea `server/.env` con las credenciales de PostgreSQL y una clave JWT privada:

```env
PORT=3000
DB_CONNECTION=postgres://usuario:contraseña@host:5432/base_de_datos
JWT_SECRET=una_clave_larga_y_secreta
```

Usa valores propios y no publiques el archivo ni sus credenciales. Inicializa el esquema y aplica las migraciones versionadas desde `server`:

```bash
npm run db:init
npm run db:migrate
```

`npm run db:migrate` aplica en orden los archivos numerados de `server/src/migrations`, registra versión y checksum en `schema_migrations`, evita ejecuciones duplicadas y rechaza una migración aplicada que haya sido modificada. Si necesitas datos locales de prueba, ejecuta después las semillas en este orden:

```bash
node src/scripts/seedEstudiantes.js
node src/scripts/seedAgentes.js
node src/scripts/seedCoordinador.js
```

Inicia el servidor:

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000/api`. Puedes comprobar el estado del servidor en `http://localhost:3000/api/health`.

### 3. Iniciar el cliente

En otra terminal, desde la raíz del repositorio:

```bash
cd client
npm install
npm run dev
```

Abre `http://localhost:5173`. El cliente está configurado para consumir la API en `http://localhost:3000/api`; inicia el servidor antes de usar la aplicación.

## Reglas operativas

### Asignación y SLA

- Las creaciones realizadas por Estudiante o Coordinador usan Round Robin independiente por especialidad exacta (`Incidente`, `Solicitud` o `Cambio`). El cursor se bloquea durante la transacción para repartir casos concurrentes de forma consistente.
- Si no hay agentes con la especialidad requerida, `idAgente` queda nulo como respaldo explícito. El caso puede gestionarse posteriormente desde coordinación.
- Los tickets creados por un Agente se asignan al propio agente que los registra.
- Son activos los tickets `Abierto`, `EnProceso` y `Pendiente`. Solo estos permiten cambiar prioridad, consultar candidatos o reasignar; `Resuelto` y `Cerrado` ya no admiten esas operaciones.
- Un ticket activo solo puede reasignarse a un Agente cuya especialidad coincida con su tipología. El Agente asignado o un Coordinador puede realizar la acción.
- Un Agente puede escalar a Coordinación un ticket activo que tenga asignado. El escalamiento asigna el caso al Coordinador y lo devuelve a `Abierto`; no aplica a casos `Resuelto` o `Cerrado`.
- Cambiar la prioridad de un ticket activo reinicia el plazo SLA desde el momento del cambio: Alta 4 horas, Media 24 horas o Baja 48 horas.

### Estados y carné

- El equipo de soporte solo puede avanzar un estado cada vez: `Abierto → EnProceso → Pendiente → Resuelto`. No puede omitir etapas, retroceder ni establecer `Cerrado`.
- Al llegar a `Resuelto` se genera la encuesta. Únicamente el Estudiante propietario puede aceptar la resolución mediante `PUT /api/tickets/:idTicket/aceptar`; esa acción cambia el estado a `Cerrado`.
- Para crear un ticket en nombre de un estudiante, la UI y la API aceptan el carné con formato `9989-XX-XXXXX`, por ejemplo `9989-23-11046`. El servidor valida ese patrón, elimina los guiones y busca el valor compacto almacenado, por ejemplo `99892311046`.

### Chat en tiempo real

- Los mensajes son texto persistente de hasta 4,000 caracteres. Solo acceden el Estudiante propietario, el Agente actualmente asignado y Coordinación.
- `GET /api/tickets/:idTicket/mensajes` recupera la conversación y `POST /api/tickets/:idTicket/mensajes` publica un mensaje autorizado.
- Socket.IO autentica la conexión con el mismo JWT, recibido en `auth.token` o como Bearer token. `ticket:join` valida nuevamente el acceso antes de unir el socket a la sala del ticket; `ticket:leave` abandona esa sala.
- El servidor emite `ticket:message` para mensajes nuevos y `ticket:updated` para creación, estado, prioridad, asignación, escalamiento y cierre. La API REST sigue siendo la vía de persistencia y respaldo si el canal en tiempo real no está disponible.
- Tras una reasignación o escalamiento, el servidor vuelve a comprobar todos los sockets de la sala y expulsa a quienes hayan perdido autorización antes de emitir actualizaciones posteriores. El nuevo Agente obtiene acceso al abrir el ticket y completar un nuevo `ticket:join`; Estudiante propietario y Coordinación conservan su acceso.
- En estado `Cerrado`, los mensajes históricos siguen disponibles, pero el servidor rechaza nuevos envíos y la interfaz muestra el chat como solo lectura.

### Listados, gestión y conocimiento

- Los listados operativos muestran 15 elementos por página: tickets del estudiante y del agente, vencidos de ambos paneles, agentes y artículos. La vista global de Coordinación muestra 25 tickets por página.
- La gestión de agentes presenta el saludo de bienvenida una sola vez por sesión del navegador mediante `sessionStorage`, permite crear agentes y actualizar su especialidad con confirmación visible.
- La gestión de conocimiento permite buscar y mantiene los artículos agrupados por categoría tanto en tabla como en tarjetas responsive; los artículos sin categoría se agrupan como `General`.

### Exportaciones

- `GET /api/metricas/tickets` devuelve a Coordinación el conjunto de tickets del reporte como JSON. Los tres endpoints de descarga (`reporte-csv`, `reporte-excel` y `reporte-calificaciones-excel`) son exclusivos de Coordinación.
- El reporte de tickets en CSV o Excel contiene: ID Ticket, Tipología, Prioridad, Estado, Fecha Creación, Fecha Resolución, Fecha Cierre, Solución, Estado SLA, Agente y Estudiante. Los casos sin responsable se identifican como `Sin Asignar`.
- El reporte Excel de calificaciones contiene Agente, Promedio de Calificación (1-5) y Porcentaje (%).

## Interfaz y accesibilidad

La interfaz responsive parte de 320 px y usa una identidad violeta: marca `#5b21b6`, hover `#4c1d95` y superficie suave `#ede9fe`, con lienzo `#f1f5f9`, tarjetas blancas y texto `#1e293b`. Incluye reflow de layouts, tablas con desplazamiento local, tarjetas móviles, enlace para saltar al contenido, foco visible, etiquetas y ayudas asociadas, regiones de estado, controles táctiles, filtros con `aria-pressed`, paginación anunciada, diálogos con gestión de foco y estados que no dependen únicamente del color. Estas medidas mejoran la accesibilidad, pero no constituyen por sí solas una certificación WCAG.

## Estructura

```text
client/   Aplicación web React
server/   API REST Express y scripts de base de datos
docs/     Documentación del proyecto y backlog ágil
```

## Documentación

- [Guía del cliente](client/README.md)
- [Guía del servidor y endpoints](server/README.md)
- [Especificación OpenAPI](server/docs/api/openapi.yaml)
- [Product backlog](docs/agile/backlog.md)
- [Informe UX: ISO 9241-210, ISO 9241-11, WCAG 2.2 y Atomic Design](docs/ux/informe-diseno-centrado-usuario.md)
- [Informe UX en formato Word](docs/ux/Informe-UX-CRM-Soporte-UMG.docx)

El cliente usa `http://localhost:3000/api` por defecto. Para otro entorno, copia `client/.env.example` como `client/.env` y modifica `VITE_API_URL`.
