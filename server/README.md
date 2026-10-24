# Sistema de Soporte UMG — Servidor

API REST del sistema de gestión de tickets de soporte para estudiantes y catedráticos de la Universidad Mariano Gálvez. Construida con Express.js y conectada a PostgreSQL (compatible con Neon u otro proveedor PostgreSQL).

---

## Equipo

| Nombre | Carné |
|---|---|
| Sergio Alejandro Gomar Barrios | 9989-23-11043 |
| Claudia Azucena de León Noriega | 9989-22-14431 |
| Angie Dayana Jacinto Soyos | 9989-23-9752 |
| Fabiola Sarahí Hipólito Muralles | 9989-23-11491 |

---

## Tecnologías

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de datos:** PostgreSQL (Neon o local)
- **Driver BD:** `pg` (node-postgres)
- **Autenticación:** JWT (`jsonwebtoken`) + BCrypt (`bcryptjs`)
- **Tiempo real:** Socket.IO con autenticación JWT y salas por ticket
- **Variables de entorno:** `dotenv`

---

## Requisitos previos

- [Node.js 18+](https://nodejs.org/)
- Un servicio PostgreSQL accesible (puede ser local, Docker o Neon)
- Git

---

## Guía de instalación

### 1. Clonar el repositorio y navegar al servidor

```bash
git clone https://github.com/serigio04/umg-server-soporte
cd umg-server-soporte
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo de variables de entorno

Este archivo **no está en el repositorio** por seguridad. Usa `server/.env.example` como inventario de variables y completa `PORT`, `DB_CONNECTION`, `JWT_SECRET` y, cuando corresponda, `CORS_ORIGIN` con valores propios. Nunca publiques `.env`, cadenas de conexión, tokens ni claves.

### 4. Inicializar y migrar la base de datos

```bash
npm run db:init
npm run db:migrate
```

`db:migrate` aplica en orden los SQL numerados de `src/migrations`, registra versión y checksum en `schema_migrations`, usa bloqueo asesor y ejecuta cada archivo nuevo dentro de una transacción.

### 5. Correr los scripts semilla

Antes de correr el servidor por primera vez en **LOCAL**, ejecuta los scripts en este orden (desde la raíz del proyecto), en linea no es necesario:

```bash
# 1. Estudiantes
node src/scripts/seedEstudiantes.js

# 2. Agentes adicionales (solicitudes y cambios)
node src/scripts/seedAgentes.js

# 3. Coordinador
node src/scripts/seedCoordinador.js
```

Las semillas son solo para entornos locales o aislados. Revisa sus datos antes de ejecutarlas y no reutilices credenciales de prueba en producción.

### 6. Correr el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`.

### 7. Verificar que funciona

```bash
curl http://localhost:3000/api/health
```

Deberías recibir:
```json
{ "status": "ok", "message": "Servidor corriendo" }
```

---

## Pruebas

Desde la carpeta `server`, ejecuta todas las pruebas con:

```bash
npm test
```

La carpeta `test/` separa `unit/` e `integration/`. Las pruebas unitarias cubren tickets y métricas en controllers, rutas y services. Las de integración levantan Express y verifican solicitudes HTTP pasando por rutas, autenticación, controllers y services. PostgreSQL se simula para que no se requiera una base de datos ni credenciales para ejecutar las pruebas.

### E2E de tickets

Los E2E levantan la API real y escriben en PostgreSQL. Ejecútalos únicamente contra una base de datos de pruebas con un usuario estudiante existente, configurando `DB_CONNECTION`, `JWT_SECRET`, `E2E_STUDENT_USER_ID` y `E2E_CONFIRM_WRITE=true` en el entorno. Luego, desde `server`, ejecuta:

```bash
npm run test:e2e
```

Los tickets creados por los E2E se identifican con un prefijo único y se eliminan junto con su historial y encuestas al terminar. Sin la configuración de prueba y la confirmación explícita, la suite se omite.

---

## Estructura del proyecto

```
.
├── test/
│   ├── e2e/
│   │   └── tickets.e2e.test.js
│   ├── integration/
│   │   ├── metrics.integration.test.js
│   │   └── tickets.integration.test.js
│   └── unit/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       └── test-helpers/
├── src/
│   ├── config/
│   │   └── db.js                  # Conexión y pool (pg) — usa DB_CONNECTION
│   ├── controllers/               # Reciben req/res, llaman a servicios
│   │   ├── agente.controller.js
│   │   ├── auth.controller.js
│   │   ├── conocimiento.controller.js
│   │   ├── message.controller.js
│   │   ├── metrics.controller.js
│   │   ├── repair.controller.js
│   │   ├── student.controller.js
│   │   ├── survey.controller.js
│   │   ├── ticket.controller.js
│   │   └── user.controller.js
│   ├── services/                  # Lógica de negocio y consultas PostgreSQL
│   │   ├── agente.service.js
│   │   ├── auth.service.js
│   │   ├── conocimiento.service.js
│   │   ├── message.service.js
│   │   ├── metrics.service.js
│   │   ├── repair.service.js
│   │   ├── student.service.js
│   │   ├── survey.service.js
│   │   ├── ticket.service.js
│   │   ├── ticket-access.service.js
│   │   └── user.service.js
│   ├── routes/                    # Definición de endpoints
│   │   ├── agente.route.js
│   │   ├── auth.route.js
│   │   ├── conocimiento.route.js
│   │   ├── metrics.route.js
│   │   ├── repair.route.js
│   │   ├── student.route.js
│   │   ├── survey.route.js
│   │   ├── ticket.route.js
│   │   └── user.route.js
│   ├── middlewares/
│   │   └── auth.middleware.js     # Verificación JWT y roles
│   ├── scripts/
│   │   ├── crearTablas.js         # Crea las tablas en la BD
│   │   ├── migrate.js              # Ejecuta migraciones SQL versionadas
│   │   ├── seedAgente.js
│   │   ├── seedAgentes.js
│   │   ├── seedCoordinador.js
│   │   ├── seedEstudiantes.js
│   │   ├── seedUsuario.js
│   │   └── testConocimiento.js
│   ├── migrations/                # Migraciones SQL numeradas
│   ├── realtime.js                # Socket.IO, autenticación y salas
│   └── index.js                   # Punto de entrada
├── .env                           # Variables de entorno (NO en el repo)
├── .gitignore
└── package.json
```

---

## Endpoints disponibles

### Auth
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | No |

### Tickets
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/tickets` | Crear ticket (asigna agente automáticamente) | Estudiante, Agente, Coordinador |
| GET | `/api/tickets` | Obtener mis tickets | Estudiante |
| GET | `/api/tickets/ultimo` | Obtener último ticket abierto | Estudiante |
| GET | `/api/tickets/historial/agente` | Obtener historial de tickets del agente | Agente, Coordinador |
| GET | `/api/tickets/abiertos` | Obtener todos los tickets abiertos | Coordinador |
| GET | `/api/tickets/:idTicket` | Obtener detalle de un ticket | Propietario, asignado o Coordinador |
| GET | `/api/tickets/:idTicket/mensajes` | Listar mensajes persistentes | Propietario, asignado o Coordinador |
| POST | `/api/tickets/:idTicket/mensajes` | Enviar mensaje de texto | Propietario, asignado o Coordinador; no Cerrado |
| PUT | `/api/tickets/:idTicket/prioridad` | Cambiar prioridad y reiniciar SLA | Agente asignado o Coordinador; solo activo |
| GET | `/api/tickets/:idTicket/candidatos` | Listar agentes de especialidad compatible | Agente asignado o Coordinador; solo activo |
| PUT | `/api/tickets/:idTicket/asignacion` | Reasignar a agente compatible | Agente asignado o Coordinador; solo activo |
| PUT | `/api/tickets/:idTicket/estado` | Avanzar al siguiente estado permitido | Agente asignado, Coordinador |
| PUT | `/api/tickets/:idTicket/aceptar` | Aceptar `Resuelto` y cerrar | Estudiante propietario |
| PUT | `/api/tickets/:idTicket/escalar` | Escalar caso activo a Coordinación | Agente asignado |

### Agentes
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/api/agentes/perfil` | Obtener perfil del agente autenticado | Agente, Coordinador |
| GET | `/api/agentes/:idAgente/tickets` | Obtener tickets asignados al agente | Agente, Coordinador |
| GET | `/api/agentes/:idAgente/ticket-prioridad` | Obtener ticket de mayor prioridad abierto | Agente, Coordinador |

### Estudiantes
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/api/estudiantes/perfil` | Obtener perfil del estudiante autenticado | Estudiante |
| GET | `/api/estudiantes/:carne` | Obtener estudiante por carné | Estudiante |

### Base de Conocimiento
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/api/conocimiento` | Obtener todos los artículos | Público |
| GET | `/api/conocimiento/:idArticulo` | Obtener un artículo específico | Público |
| POST | `/api/conocimiento` | Crear artículo | Agente, Coordinador |
| PUT | `/api/conocimiento/:idArticulo` | Actualizar artículo | Agente, Coordinador |
| DELETE | `/api/conocimiento/:idArticulo` | Eliminar artículo | Agente, Coordinador |

### Usuarios (Gestión)
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/usuarios/agente` | Registrar nuevo agente | Coordinador |
| POST | `/api/usuarios/estudiante` | Registrar nuevo estudiante | Coordinador |
| GET | `/api/usuarios/agentes` | Listar todos los agentes | Coordinador |
| PUT | `/api/usuarios/agentes/:idAgente/especialidad` | Modificar especialidad del agente | Coordinador |
| PUT | `/api/usuarios/password` | Cambiar contraseña | Autenticado |

### Métricas y Reportes
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/api/metricas/dashboard` | Dashboard del coordinador | Coordinador |
| GET | `/api/metricas/tickets` | Datos de tickets del reporte en JSON | Coordinador |
| GET | `/api/metricas/agente/:idAgente` | Métricas de un agente específico | Agente, Coordinador |
| GET | `/api/metricas/reporte-csv` | Descargar reporte en CSV | Coordinador |
| GET | `/api/metricas/reporte-excel` | Descargar reporte en Excel | Coordinador |
| GET | `/api/metricas/reporte-calificaciones-excel` | Descargar reporte de calificaciones (Excel) | Coordinador |

### Encuestas
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/encuestas/:idEncuesta/responder` | Enviar respuestas de encuesta | Autenticado |
| GET | `/api/encuestas/ticket/:idTicket` | Obtener encuesta asociada a ticket | Autenticado |

### Mantenimiento
| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | `/api/repair.all/repair-all` | Reparar/sincronizar datos en BD | No |

## Reglas del flujo de tickets

- El flujo normal es estricto y unidireccional: `Abierto → EnProceso → Pendiente → Resuelto`.
- Agente y Coordinador solo pueden aplicar el siguiente estado. No pueden retroceder, saltar etapas ni elegir `Cerrado`.
- Solo el Estudiante propietario puede ejecutar `PUT /api/tickets/:idTicket/aceptar`, y únicamente desde `Resuelto`; la aceptación registra `Cerrado`.
- `Abierto`, `EnProceso` y `Pendiente` son estados activos. Solo en ellos se puede cambiar prioridad, consultar candidatos o reasignar. Cambiar prioridad reinicia el límite SLA desde ese instante.
- La reasignación exige que el Agente destino tenga especialidad exactamente igual a la tipología. El escalamiento es una operación separada que transfiere un caso activo al Coordinador y lo devuelve a `Abierto`.
- Cuando soporte crea para un estudiante, `carnetEstudiante` debe usar `9989-XX-XXXXX`. El controlador valida la máscara y elimina los guiones para consultar el carné compacto almacenado.

## Chat y Socket.IO

- REST persiste mensajes de 1 a 4,000 caracteres en `GET/POST /api/tickets/:idTicket/mensajes`. Acceden únicamente el Estudiante propietario, el Agente actualmente asignado y Coordinación.
- Los mensajes de un ticket `Cerrado` permanecen consultables, pero no se admiten envíos nuevos.
- Socket.IO acepta el JWT en `auth.token` o en `Authorization: Bearer ...`. `ticket:join` comprueba acceso antes de unir la sala y `ticket:leave` la abandona.
- El servidor emite `ticket:message` al crear mensajes y `ticket:updated` al modificar el ticket.
- Después de reasignar, escalar o cambiar estado, `refrescarAccesosTicket` revisa la sala y expulsa sockets que ya no estén autorizados. El nuevo asignado se incorpora al abrir el detalle y emitir `ticket:join`; Estudiante propietario y Coordinación conservan acceso.

---

## Tablas PostgreSQL utilizadas

| Tabla | Descripción |
|---|---|
| `Usuarios` | Base de autenticación con roles (Estudiante, Agente, Coordinador) |
| `Estudiantes` | Perfil del estudiante con carné y carrera |
| `AgenteSoporte` | Agente con especialidad (Incidente, Solicitud, Cambio) y sede |
| `Tickets` | Solicitud/incidencia con SLA |
| `EstadosTicket` | Historial de cambios de estado del ticket |
| `BasesConocimiento` | Repositorio de bases de conocimiento |
| `Articulos` | Artículos individuales de autogestión y ayuda |
| `Encuestas` | Encuestas de satisfacción |
| `RespuestasEncuesta` | Respuestas de usuarios a las encuestas |

---

## Problemas comunes y comprobaciones

- **Cadena de conexión inválida / error de conexión:** Verifica que `DB_CONNECTION` en `.env` esté bien formada y que la base de datos PostgreSQL esté accesible.
- **Tablas faltantes / errores en queries:** Revisa que las migraciones o scripts de creación de tablas se hayan ejecutado antes de correr los seeds.
- **Puerto 3000 en uso:** Cambia el valor de `PORT` en el `.env` o cierra el proceso que usa ese puerto con `npx kill-port 3000`.

Si necesitas que adapte el proyecto para usarse con Oracle en lugar de PostgreSQL, avísame y lo documentamos o añadimos una rama/archivo de configuración separado.
