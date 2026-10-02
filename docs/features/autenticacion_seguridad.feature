# language: es
Característica: Autenticación, Control de Acceso y Seguridad Transversal
  Como arquitecto de software y usuario del sistema
  Quiero garantizar la validación de tokens JWT y el manejo centralizado de excepciones
  Para proteger los endpoints de la API y mantener un formato estandarizado de error

  @Seguridad @CaminoFeliz
  Escenario: Acceso exitoso a recurso protegido con token JWT válido
    Dado que un usuario posee un token Bearer JWT válido con rol "Agente"
    Y envía el token en la cabecera "Authorization"
    Cuando realiza una petición HTTP GET a "/api/tickets/101"
    Entonces el sistema valida la autenticidad de la firma y vigencia del token
    Y responde con un código de estado HTTP 200 OK

  @Seguridad @Excepcion
  Escenario: Denegación de acceso por token JWT expirado
    Dado que un usuario envía un token JWT con tiempo de expedición mayor a 8 horas
    Cuando ejecuta cualquier petición HTTP a un endpoint protegido de la API
    Entonces el middleware de seguridad invalida la sesión
    Y responde con un código de estado HTTP 401 Unauthorized
    Y el cuerpo de la respuesta contiene {"message": "Sesión expirada o token inválido"}

  @Seguridad @Excepcion
  Escenario: Intento de acceso a recurso sin enviar cabecera de autorización
    Dado que la petición HTTP no incluye el encabezado "Authorization"
    Cuando se solicita el endpoint "/api/dashboard/metricas/agentes"
    Entonces el sistema bloquea el procesamiento de la solicitud
    Y responde con un código de estado HTTP 401 Unauthorized

  @Seguridad @Excepcion
  Escenario: Ocultamiento de detalles técnicos del servidor ante un error interno (HTTP 500)
    Dado que ocurre una excepción no controlada en la base de datos o lógica interna
    Cuando el cliente ejecuta una solicitud a cualquier endpoint de la API
    Entonces el manejador global de excepciones captura la falla
    Y responde con un código de estado HTTP 500 Internal Server Error
    Y la respuesta devuelve exclusivamente {"message": "Error interno del servidor"}