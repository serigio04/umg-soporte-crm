# Sistema de Soporte UMG — Cliente

Interfaz de usuario del sistema de gestión de tickets de soporte para estudiantes y catedráticos de la Universidad Mariano Gálvez. Construida con React y Vite.

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

- **Framework:** React 18
- **Bundler:** Vite
- **Routing:** React Router DOM
- **HTTP:** Axios
- **Lenguaje:** JavaScript (JSX)

---

## Requisitos previos

- [Node.js 18+](https://nodejs.org/)
- El servidor Express corriendo en `http://localhost:3000`
- Git

---

## Guía de instalación

### 1. Clonar el repositorio y navegar al cliente

```bash
git clone https://github.com/serigio04/umg-frontend-soporte
cd umg-frontend-soporte
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Correr el cliente

```bash
npm run dev
```

El cliente estará disponible en `http://localhost:5173`.

**Importante:** El servidor Express debe estar corriendo antes de usar el cliente. Sin el servidor, el login y todas las funciones que consumen la API no funcionarán.

---

## Estructura del proyecto

```
client/
├── src/
│   ├── pages/
│   │   ├── Login.jsx                       # Inicio de sesión
│   │   ├── DashboardEstudiante.jsx         # Panel principal del estudiante
│   │   ├── DashboardAgente.jsx             # Panel principal del agente
│   │   ├── DashboardCoordinador.jsx        # Panel de supervisión del coordinador
│   │   ├── CrearTicket.jsx                 # Formulario para crear ticket
│   │   ├── DetalleTicket.jsx               # Vista detallada de ticket
│   │   ├── HistorialTickets.jsx            # Historial de tickets del estudiante
│   │   ├── HistorialTicketsAgente.jsx      # Historial de tickets del agente
│   │   ├── HistorialTicketsCoordinador.jsx # Historial general de tickets
│   │   ├── TicketsAsignados.jsx            # Tickets abiertos asignados al agente
│   │   ├── EncuestaTicket.jsx              # Encuesta de satisfacción post-resolución
│   │   ├── GestionConocimiento.jsx         # Gestor de base de conocimiento
│   │   └── PreguntasFrecuentes.jsx         # Visor de base de conocimiento
│   ├── components/
│   │   ├── CambiarPassword.jsx             # Modal para cambiar contraseña
│   │   └── RutaProtegida.jsx               # HOC para proteger rutas
│   ├── services/
│   │   └── api.js                          # Configuración de Axios + token JWT
│   ├── context/                            # Contextos de React (estado global)
│   ├── App.jsx                             # Rutas principales
│   └── main.jsx                            # Punto de entrada
├── index.html
└── package.json
```

---

## Rutas disponibles

| Ruta | Componente | Rol requerido | Descripción |
|---|---|---|---|
| `/login` | `Login.jsx` | Ninguno | Inicio de sesión |
| `/estudiante/dashboard` | `DashboardEstudiante.jsx` | Estudiante | Panel principal del estudiante |
| `/estudiante/tickets` | `HistorialTickets.jsx` | Estudiante | Historial de todos sus tickets |
| `/tickets/nuevo` | `CrearTicket.jsx` | Estudiante, Agente | Formulario para crear ticket |
| `/tickets/:id` | `DetalleTicket.jsx` | Estudiante, Agente, Coordinador | Vista detallada de un ticket |
| `/encuesta/:id` | `EncuestaTicket.jsx` | Estudiante | Encuesta de satisfacción |
| `/agente/dashboard` | `DashboardAgente.jsx` | Agente, Coordinador | Panel principal del agente |
| `/agente/tickets` | `TicketsAsignados.jsx` | Agente, Coordinador | Tickets abiertos asignados |
| `/agente/historial` | `HistorialTicketsAgente.jsx` | Agente, Coordinador | Historial de tickets procesados |
| `/coordinador/dashboard` | `DashboardCoordinador.jsx` | Coordinador | Panel de supervisión |
| `/coordinador/tickets` | `HistorialTicketsCoordinador.jsx` | Coordinador | Historial general de tickets |
| `/base-conocimiento` | `GestionConocimiento.jsx` | Agente, Coordinador | Gestor de base de conocimiento |
| `/preguntas-frecuentes` | `PreguntasFrecuentes.jsx` | Estudiante, Agente | Visor de base de conocimiento |

---

## Páginas implementadas

### Autenticación

**Login**
Formulario de inicio de sesión que consume `POST /api/auth/login`. Guarda el token JWT y los datos del usuario en `localStorage` y redirige según el rol:
- **Estudiante** → `/estudiante/dashboard`
- **Agente** → `/agente/dashboard`
- **Coordinador** → `/coordinador/dashboard`

---

### Dashboards

**Dashboard Estudiante**
Panel principal del estudiante con acceso rápido a funciones clave:
- **Acciones rápidas** — botones para crear ticket, ver historial y preguntas frecuentes
- **Mi perfil** — nombre, correo, carné, carrera y saldo del estudiante
- **Último ticket abierto** — ID, tipo, fecha, descripción y estado del ticket más reciente
- **Cambiar contraseña** — modal integrado para actualizar contraseña
- **Colores codificados por estado** — visualización clara del progreso de tickets

**Dashboard Agente**
Panel de control para agentes de soporte:
- **Acciones rápidas** — ver tickets asignados, historial, crear ticket, base de conocimiento
- **Mi perfil** — nombre, correo, especialidad, sede y nivel de acceso
- **Métricas** — tickets resueltos, tiempo promedio de resolución, cumplimiento de SLA
- **Tickets por prioridad** — listado paginado de tickets vencidos (20 items por página)
- **Opciones adicionales para coordinadores** — crear estudiante, crear agente
- **Escalación de tickets** — botón para escalar al coordinador si es necesario

**Dashboard Coordinador**
Panel de supervisión y métricas generales:
- **Dashboard de KPIs** — slider interactivo de calificaciones general y por agente
- **SLA vencidos** — listado paginado con gestión completa (20 items por página)
- **Gestión de agentes** — edición de especialidades en tiempo real
- **Reportes** — descarga en formato CSV y Excel
- **Actualización automática** — métricas se actualizan cada 5 minutos

---

### Gestión de Tickets

**Crear Ticket**
Formulario para abrir nuevas solicitudes de soporte:
- **Tipología ITIL** — selección entre Incidente (Alta), Solicitud (Media), Cambio (Baja)
- **Descripción** — campo con validación mínima (10 caracteres)
- **Prioridad automática** — asignada según tipología con información de SLA (4h/24h/48h)
- **Campo adicional para agentes** — carné del estudiante cuando un agente crea el ticket
- **Asignación automática** — el agente se asigna automáticamente según la tipología

**Detalle Ticket**
Visualización completa e interactiva de un ticket:
- **Información completa** — ID, estado, prioridad, descripción y fechas
- **Cambio de estado** — transiciones con opción de agregar comentarios
- **Control de permisos** — solo agentes/coordinadores pueden editar
- **Aceptación de resolución** — estudiantes pueden confirmar que el ticket fue resuelto
- **Escalación** — opción para escalar al coordinador
- **Colores codificados** — visualización clara por estado y prioridad

**Historial de Tickets (Estudiante)**
Registro completo de tickets del estudiante:
- **Filtros por estado** — Todos, Abierto, En Proceso, Pendiente, Resuelto, Cerrado
- **Contador dinámico** — actualización en tiempo real según filtro activo
- **Información por ticket** — tipo, descripción (máx. 2 líneas), estado y fecha
- **Encuestas de satisfacción** — carga automática para tickets resueltos/cerrados
- **Visualización de encuestas completadas** — historial de evaluaciones

**Tickets Asignados (Agente)**
Lista de tickets abiertos para el agente activo:
- **Obtención automática de ID** — identificación del agente logueado
- **Filtros** — Todos, Abierto, En Proceso, Pendiente, Resuelto, Cerrado
- **Información visual** — prioridad y estado con colores, tipología y descripción
- **Acceso rápido** — botón para ver detalles completos del ticket
- **Contador** — visualización de tickets por filtro activo

**Historial Tickets (Agente)**
Registro histórico de todos los tickets procesados:
- **Historial completo** — todos los tickets del agente, no solo los abiertos
- **Filtros** — En Proceso, Pendiente, Resuelto, Cerrado
- **Visualización con badges** — prioridad y estado con colores
- **Paginación** — navegación eficiente de resultados
- **Contador** — tickets filtrados en tiempo real

**Historial Tickets (Coordinador)**
Gestión centralizada de todos los tickets:
- **Visualización general** — todos los tickets abiertos del sistema
- **Filtrado por estado** — acceso rápido a tickets específicos
- **Búsqueda integrada** — localización de tickets por criterios
- **Control de asignación** — reasignación de tickets desde esta vista

---

### Satisfacción del Cliente

**Encuesta Ticket**
Evaluación de satisfacción post-resolución:
- **Calificación 5 estrellas** — interfaz visual interactiva
- **Comentario opcional** — campo de texto para feedback detallado
- **Validaciones** — calificación obligatoria, comentario opcional
- **Integración API** — envío a `POST /encuestas/{idEncuesta}/responder`
- **Confirmación** — mensaje de éxito tras completar
- **Redirección automática** — regresa al historial tras completar

---

### Base de Conocimiento

**Gestión de Conocimiento**
Editor CRUD completo de artículos de soporte (acceso: Agente, Coordinador):
- **Crear artículos** — título, categoría, contenido enriquecido
- **Editar artículos** — modal para modificación de existentes
- **Eliminar artículos** — con confirmación de seguridad
- **Editor visual enriquecido**:
  - Formateo: negrita, cursiva, encabezados, listas
  - Estilos avanzados: bloques de código, destacados
  - Selector de formato con dropdown
  - Sincronización automática con contentEditable
- **Búsqueda local** — filtro en tiempo real en tabla de artículos
- **Categorías dinámicas** — datalist de sugerencias para nuevas categorías
- **Paginación** — navegación eficiente de artículos
- **Mensajes de estado** — confirmaciones de éxito y errores

**Preguntas Frecuentes**
Visor público de base de conocimiento (acceso: Estudiante, Agente):
- **Búsqueda de artículos** — integración con API en tiempo real
- **Visualización en acordeones** — organización por categorías expandibles/colapsables
- **Render seguro de Markdown** — encabezados, negrita, cursiva, código, listas
- **Detección automática** — renderizado inteligente de HTML vs Markdown
- **Auto-expansión** — abre categorías automáticamente en búsquedas
- **Vista detallada** — visualización completa de artículos seleccionados

---

### Componentes Reutilizables

**CambiarPassword**
Modal para cambio seguro de contraseña:
- **Validación de contraseña actual** — verificación de identidad
- **Coincidencia de nuevas contraseñas** — validación de confirmación
- **Interfaz modal** — overlay oscuro con formulario flotante
- **Integración API** — `PUT /usuarios/password`
- **Cierre automático** — tras cambio exitoso
- **Mensaje de éxito** — confirmación visual del cambio

**RutaProtegida**
Componente HOC para protección de rutas:
- **Validación de autenticación** — verificación de token en localStorage
- **Control de roles** — permisos por Estudiante, Agente, Coordinador
- **Redirección inteligente** — según permisos y rol del usuario
- **Protección de acceso** — redirección automática al login si no autenticado
- **Manejo de permisos** — redirección según rol si acceso denegado

---

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Estudiante | `sergio@miumg.edu.gt` | `123456` |
| Agente (Incidente) | `agente@miumg.edu.gt` | `123456` |
| Agente (Solicitud) | `solicitudes@miumg.edu.gt` | `123456` |
| Agente (Cambio) | `cambios@miumg.edu.gt` | `123456` |
| Coordinador | `coordinador@miumg.edu.gt` | `123456` |

---

## Problemas comunes

**Pantalla en blanco al abrir el navegador**
→ Verifica que Vite esté corriendo con `npm run dev` y abre `http://localhost:5173`.

**Error de red al hacer login (Network Error)**
→ El servidor Express no está corriendo. Navega a la carpeta `server/` y corre `npm run dev`.

**CORS bloqueado en el navegador**
→ Verifica que en el servidor `index.js` el origen permitido sea `http://localhost:5173` exactamente, sin barra al final.

**Token expirado — redirige al login inesperadamente**
→ El token JWT dura 8 horas. Cierra sesión y vuelve a entrar. Si el problema persiste, limpia el `localStorage` desde las DevTools del navegador (`Application → Local Storage → Clear All`).

**Los datos del dashboard no cargan**
→ Abre las DevTools del navegador (`F12 → Console`) y revisa si hay errores de red. Verifica que el servidor esté corriendo y que el token en `localStorage` sea válido.

**Failed to resolve import "./pages/NombrePagina"**
→ El archivo JSX no existe o tiene un error tipográfico en el nombre. Verifica que el nombre del archivo coincida exactamente con el import en `App.jsx`, incluyendo mayúsculas.