# language: es
Característica: Consulta de Detalle e Historial de SLA de Tickets
  Como usuario del sistema
  Quiero consultar los detalles de un ticket específico por su identificador
  Para conocer la información completa del estudiante, el agente asignado, el historial de estados y las horas restantes de SLA.

  Escenario: Consulta exitosa de ticket dentro del tiempo de SLA (No Vencido)
    Dado que existe un ticket en la base de datos con ID 105, prioridad "Alta" y creado hace 1 hora
    Cuando el usuario envía una solicitud HTTP "GET" a "/api/tickets/105"
    Entonces el sistema responde con un código de estado HTTP 200 OK
    Y el cuerpo de la respuesta incluye los siguientes campos:
      | campo            | valor                          |
      | idTicket         | 105                            |
      | prioridadSLA     | Alta                           |
      | vencido          | false                          |
    Y la propiedad "horasRestantes" es mayor a 0 y menor o igual a 3.0
    Y el arreglo "historial" contiene la trazabilidad de estados ordenada cronológicamente

  Escenario: Consulta de un ticket inexistente
    Dado que el ticket con ID 99999 no existe en la base de datos
    Cuando el usuario envía una solicitud HTTP "GET" a "/api/tickets/99999"
    Entonces el sistema responde con un código de estado HTTP 404 Not Found
    Y el cuerpo de la respuesta contiene el mensaje "Ticket no encontrado"