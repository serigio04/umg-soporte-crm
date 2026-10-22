# language: es
Característica: Creación y Asignación Automática de Tickets de Soporte ITIL
  Como usuario autenticado del Sistema de Soporte UMG (Estudiante, Agente o Coordinador)
  Quiero registrar un ticket indicando la tipología ITIL y la descripción
  Para que el sistema asigne la prioridad SLA correspondiente, el agente encargado y registre el estado inicial.

  Esquema del escenario: Creación exitosa de ticket con cálculo de SLA y asignación de Agente
    Dado que un usuario con rol "<Rol>" y ID <IdUsuario> se encuentra autenticado
    Y existe un estudiante activo en la base de datos con el carnet "<CarnetEstudiante>"
    Cuando envía una solicitud HTTP "POST" a "/api/tickets" con los datos:
      | tipologiaITIL     | <TipologiaITIL>     |
      | descripcion       | <Descripcion>       |
      | carnetEstudiante  | <CarnetEstudiante>  |
    Entonces el sistema responde con un código de estado HTTP 201 Created
    Y la respuesta contiene un objeto ticket con el atributo "prioridadSLA" igual a "<PrioridadSLA>"
    Y el ticket es asignado al agente con el ID <IdAgenteEsperado>
    Y se verifica que la tabla "tickets" contiene el registro con estado "Abierto"
    Y se verifica que la tabla "estadosticket" contiene el registro de auditoría "Ticket creado"

    Ejemplos:
      | Rol        | IdUsuario | CarnetEstudiante | TipologiaITIL | Descripcion                               | PrioridadSLA | IdAgenteEsperado |
      | Estudiante | 5         | 1290-20-1234     | Incidente     | No puedo ingresar al portal MiUMG         | Alta         | 1                |
      | Estudiante | 5         | 1290-20-1234     | Solicitud     | Certificación de cursos aprobados         | Media        | 2                |
      | Agente     | 2         | 1290-21-9876     | Cambio        | Solicitud de cambio de sección de carrera | Baja         | 3                |

  Escenario: Rechazo de creación por tipología ITIL no válida
    Dado que un estudiante se encuentra autenticado en el sistema
    Cuando envía una solicitud HTTP "POST" a "/api/tickets" con los datos:
      | tipologiaITIL | ConsultaGeneral              |
      | descripcion   | Tengo una duda sobre mi pago |
    Entonces el sistema responde con un código de estado HTTP 400 Bad Request
    Y el cuerpo de la respuesta contiene el mensaje "Tipología inválida"
    Y la base de datos no registra ninguna transacción en la tabla "tickets"

  Escenario: Error al crear ticket por Agente sin especificar carnet de estudiante
    Dado que un usuario con rol "Agente" se encuentra autenticado
    Cuando envía una solicitud HTTP "POST" a "/api/tickets" sin el campo "carnetEstudiante":
      | tipologiaITIL | Incidente               |
      | descripcion   | Caída general de red    |
    Entonces el sistema responde con un código de estado HTTP 400 Bad Request
    Y el cuerpo de la respuesta contiene el mensaje "Se requiere carnet del estudiante"