# Sistema de Soporte UMG

Aplicación web para administrar solicitudes de soporte de estudiantes de la Universidad Mariano Gálvez. Permite registrar y dar seguimiento a tickets, atenderlos según su tipología y especialidad, consultar la base de conocimiento y supervisar métricas de soporte.

## Funcionalidades

- Acceso para estudiantes, agentes y coordinadores mediante autenticación JWT.
- Creación, asignación y seguimiento de tickets con prioridades y SLA según su tipología.
- Atención, cambio de estado, escalamiento e historial de tickets.
- Base de conocimiento y preguntas frecuentes.
- Paneles por rol, métricas y descarga de reportes.
- Encuestas de satisfacción posteriores a la resolución.

## Tecnologías

- **Frontend:** React, Vite, React Router y Axios.
- **Backend:** Node.js, Express y JSON Web Tokens.
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

No subas este archivo al repositorio. Inicializa el esquema y, si necesitas datos locales de prueba, ejecuta las semillas en este orden desde `server`:

```bash
node src/scripts/crearTablas.js
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
