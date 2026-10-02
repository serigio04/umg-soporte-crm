# language: es
Característica: Dashboard Gerencial y Métricas de Rendimiento
  Como coordinador de soporte
  Quiero consultar indicadores clave de rendimiento (MTTR, volumen y estados de SLA)
  Para monitorear la efectividad del servicio desde la API y la interfaz móvil

  # -------------------------------------------------------------------
  # US-API-04 / US-API-05: Métricas del Dashboard (Backend)
  # -------------------------------------------------------------------
  @Dashboard @CaminoFeliz
  Escenario: Consulta autorizada de métricas por agente
    Dado un token Bearer JWT correspondiente a un usuario "Coordinador" (NivelAcceso >= 3)
    When se realiza una petición HTTP GET a "/api/dashboard/metricas/agentes"
    Then el sistema responde con un código de estado HTTP 200 OK
    And devuelve el objeto JSON con "totalAbiertos", "totalResueltos" y "MTTR" agrupado por agente

  @Dashboard @CaminoFeliz
  Escenario: Consulta de métricas por clasificación de tickets
    Dado un token Bearer JWT válido correspondiente a un usuario "Coordinador"
    When se efectúa la petición HTTP GET a "/api/dashboard/metricas/tickets/clasificacion"
    Then el sistema responde con un código de estado HTTP 200 OK
    And devuelve las cantidades categorizadas por tipo "Incidente", "Solicitud" y "Cambio"

  @Dashboard @Excepcion
  Escenario: Rechazo de acceso a métricas por permisos insuficientes
    Dado un token Bearer JWT perteneciente a un usuario con rol "Estudiante" o "Agente"
    When se solicita el endpoint HTTP GET "/api/dashboard/metricas/agentes"
    Then el sistema deniega la petición
    And responde con un código de estado HTTP 403 Forbidden
    And devuelve la respuesta {"message": "Acceso no autorizado para este recurso"}

  # -------------------------------------------------------------------
  # US-WEB-05: Dashboard Gerencial Móvil (Frontend)
  # -------------------------------------------------------------------
  @Dashboard @CaminoFeliz
  Escenario: Adaptación responsive de métricas y alertas de SLA vencido
    Dado un Coordinador consultando el Dashboard desde un smartphone
    When los datos de rendimiento finalizan de cargar
    Then las métricas clave se presentan apiladas en tarjetas táctiles (KPI Cards)
    And los tickets que sobrepasaron el tiempo de SLA se destacan visualmente en color rojo con la etiqueta "Vencido"