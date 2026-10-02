# language: es
Característica: Gestión Operativa y Seguimiento de Tickets de Soporte
  Como estudiante, agente o coordinador
  Quiero registrar, consultar, actualizar y escalar tickets
  Para gestionar y resolver las incidencias universitarias dentro de los tiempos de SLA

  # -------------------------------------------------------------------
  # US-API-01 / US-WEB-01: Creación de Ticket
  # -------------------------------------------------------------------
  @Tickets @CaminoFeliz
  Escenario: Creación exitosa de ticket desde vista móvil por un Estudiante
    Dado un usuario autenticado con el rol "Estudiante"
    Y se encuentra en el formulario de creación en un dispositivo con ancho menor a 768px
    Cuando ingresa la categoría "Incidente", prioridad "Alta" y la descripción del caso
    Y presiona el botón "Enviar Ticket"
    Then el sistema asocia automáticamente el identificador interno del estudiante
    Y responde vía API con un código de estado HTTP 201 Created
    Y despliega una notificación emergente (toast) confirmando el número de ticket y tiempo SLA

  @Tickets @CaminoFeliz
  Escenario: Creación de ticket a nombre de un estudiante por Agente con carné válido
    Dado un usuario autenticado con el rol "Agente" o "Coordinador"
    When ingresa el carné "9989-21-12345" en el campo obligatorio
    And completa los datos de la solicitud y envía el formulario
    Then el sistema valida que el carné cumpla la máscara "9989-XX-XXXXX"
    And crea el ticket en la base de datos respondiendo con código HTTP 201 Created

  @Tickets @Excepcion
  Escenario: Rechazo de creación de ticket por formato de carné inválido
    Dado un usuario autenticado con el rol "Agente"
    When intenta registrar un ticket ingresando el carné "12345-ABC"
    Then el sistema aplica la regla de negocio RN06
    And rechaza la solicitud sin guardar registros
    And responde con un código de estado HTTP 400 Bad Request
    And devuelve el mensaje {"message": "Formato de carné universitario no válido"}

  # -------------------------------------------------------------------
  # US-API-02 / US-WEB-02: Atención, Cambio de Estado y Escalamiento
  # -------------------------------------------------------------------
  @Tickets @CaminoFeliz
  Escenario: Actualización exitosa del estado de un ticket activo y registro en historial
    Dado un ticket en estado "Abierto" con ID "505"
    And un usuario autenticado con rol "Agente"
    When ejecuta una petición HTTP PUT a "/api/tickets/505/estado" con estado "EnProceso" y comentario "Iniciando revisión"
    Then el sistema actualiza el estado en la base de datos a "EnProceso"
    And genera un registro inmutable en el historial con fecha, autor y comentario técnico
    And responde con un código de estado HTTP 200 OK

  @Tickets @CaminoFeliz
  Escenario: Escalamiento exitoso de ticket a Coordinación desde interfaz móvil
    Dado un Agente autenticado visualizando el detalle de un ticket en estado "EnProceso"
    When presiona el botón "Escalar a Coordinador"
    Then el sistema asigna el ticket al rol "Coordinador"
    And registra automáticamente una nota de auditoría en la línea de tiempo vertical
    And actualiza la pantalla mostrando al nuevo responsable

  @Tickets @Excepcion
  Escenario: Intento de modificación en un ticket en estado Cerrado
    Dado un ticket con ID "808" cuyo estado actual es "Cerrado"
    When un Agente intenta enviar una petición HTTP PUT a "/api/tickets/808/estado"
    Then el sistema bloquea la operación aplicando la regla RN03
    And responde con un código de estado HTTP 400 Bad Request
    And devuelve la respuesta JSON {"message": "Un ticket cerrado no puede ser modificado"}

  # -------------------------------------------------------------------
  # US-API-03: Consulta de Detalle de Ticket
  # -------------------------------------------------------------------
  @Tickets @CaminoFeliz
  Escenario: Consulta exitosa del detalle e historial de un ticket
    Dado un "idTicket" con valor "101" existente en la base de datos
    When se realiza una petición HTTP GET a "/api/tickets/101"
    Then el sistema responde con un código de estado HTTP 200 OK
    And devuelve el objeto JSON con "idTicket", "asunto", "estado", "horasRestantes", "vencido" e "historial"

  @Tickets @Excepcion
  Escenario: Consulta de un ticket con identificador inexistente
    Dado un "idTicket" con valor "999999" que no está registrado
    When se efectúa una petición HTTP GET a "/api/tickets/999999"
    Then el sistema responde con un código de estado HTTP 404 Not Found
    And devuelve la estructura JSON {"message": "Ticket no encontrado"}