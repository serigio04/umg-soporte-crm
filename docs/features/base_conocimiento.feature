# language: es
Característica: Gestión e Integración de la Base de Conocimientos (KB)
  Como estudiante o coordinador de soporte
  Quiero publicar artículos instructivos y consultar soluciones frecuentes
  Para resolver dudas mediante autoservicio y reducir la carga de tickets

  # -------------------------------------------------------------------
  # US-WEB-03: Gestión de Artículos por Coordinador
  # -------------------------------------------------------------------
  @BaseConocimientos @CaminoFeliz
  Escenario: Publicación exitosa de un artículo de soporte
    Dado un usuario autenticado con el rol "Coordinador"
    And se encuentra en la pantalla de gestión de la Base de Conocimientos
    When ingresa el título "Configuración de Red WiFi", categoría "Redes" y el contenido de la guía
    And presiona el botón "Guardar Artículo"
    Then la aplicación guarda la información en el sistema
    And confirma la publicación mediante una alerta de éxito

  @BaseConocimientos @Excepcion
  Escenario: Restricción de acceso a la creación de artículos a usuarios no autorizados
    Dado un usuario autenticado con el rol "Estudiante" o "Agente"
    When intenta ingresar directamente a la ruta "/kb/crear"
    Then el enrutador de la aplicación intercepta la navegación
    And redirige al usuario a su panel principal denegando el acceso

  # -------------------------------------------------------------------
  # US-WEB-04: Autoservicio y Búsqueda Previa
  # -------------------------------------------------------------------
  @BaseConocimientos @CaminoFeliz
  Escenario: Despliegue de sugerencias automáticas al redactar el asunto
    Dado un estudiante interactuando con el formulario de creación de ticket
    When escribe la frase "restablecer contraseña" en el campo "Asunto"
    Then el sistema consulta en tiempo real la Base de Conocimientos
    And despliega un listado interactivo con artículos y soluciones sugeridas

  @BaseConocimientos @CaminoFeliz
  Escenario: Cancelación del flujo de ticket tras resolver duda con un artículo
    Dado que el sistema desplegó artículos sugeridos al estudiante
    When el estudiante selecciona un artículo y presiona "Resolvió mi duda"
    Then la aplicación cancela la creación del ticket sin realizar peticiones de guardado al servidor
    And retorna al estudiante a la pantalla de inicio