WITH categorias(categoria) AS (
  VALUES
    ('Plataformas académicas'),
    ('Matrícula y cursos'),
    ('Pagos y solvencias'),
    ('Soporte técnico')
)
INSERT INTO basesconocimiento (categoria, totalarticulos)
SELECT categoria, 0
FROM categorias nueva
WHERE NOT EXISTS (
  SELECT 1
  FROM basesconocimiento existente
  WHERE LOWER(existente.categoria) = LOWER(nueva.categoria)
);

WITH preguntas(categoria, titulo, contenido) AS (
  VALUES
    (
      'Plataformas académicas',
      '¿Cómo ingreso por primera vez al portal académico?',
      $$<p>Ingresa al portal académico institucional y selecciona <strong>Iniciar sesión</strong>. Utiliza tu correo institucional completo y la contraseña temporal entregada durante la inscripción.</p><p>Al ingresar por primera vez, el sistema puede solicitar que cambies la contraseña y confirmes tus datos. Si las credenciales no funcionan, crea un ticket de tipo <strong>Incidente</strong>.</p>$$
    ),
    (
      'Plataformas académicas',
      '¿Qué hago si olvidé la contraseña del portal?',
      $$<p>Selecciona la opción <strong>Olvidé mi contraseña</strong> en la pantalla de acceso. Escribe tu correo institucional y sigue el enlace enviado a tu bandeja de entrada.</p><p>Revisa también correo no deseado. Si no recibes el mensaje después de unos minutos, registra un ticket indicando tu carné y el portal al que intentas acceder.</p>$$
    ),
    (
      'Plataformas académicas',
      '¿Por qué no aparecen mis cursos en el aula virtual?',
      $$<p>Los cursos pueden tardar hasta 24 horas en aparecer después de completar la asignación. Verifica primero que el curso figure como asignado en el portal académico.</p><p>Si ya transcurrió ese plazo, adjunta al ticket el nombre del curso, sección, sede y una captura de la pantalla del aula virtual.</p>$$
    ),
    (
      'Plataformas académicas',
      '¿Cómo actualizo mis datos personales?',
      $$<p>Desde el portal académico abre <strong>Mi perfil</strong> y revisa los campos habilitados para edición. Guarda los cambios y vuelve a iniciar sesión para confirmar que fueron aplicados.</p><p>Los datos oficiales, como nombre o número de identificación, requieren validación administrativa. Para esos cambios crea una solicitud de soporte y adjunta el documento correspondiente.</p>$$
    ),
    (
      'Plataformas académicas',
      '¿Dónde consulto mis notas y actividades?',
      $$<p>Las notas oficiales se consultan en la sección <strong>Calificaciones</strong> del portal académico. Las actividades y retroalimentación de cada curso se encuentran dentro del aula virtual.</p><p>Si una nota aún no aparece, consulta primero con el docente. Soporte puede ayudarte cuando la sección no carga o muestra un error técnico.</p>$$
    ),
    (
      'Matrícula y cursos',
      '¿Cómo realizo la asignación de cursos?',
      $$<p>Abre el módulo de asignaciones, selecciona el ciclo vigente y agrega los cursos disponibles para tu carrera y semestre. Revisa horarios y prerrequisitos antes de confirmar.</p><p>Descarga o guarda la constancia final. Si un curso esperado no aparece, crea una solicitud e indica carrera, semestre, sede y jornada.</p>$$
    ),
    (
      'Matrícula y cursos',
      '¿Por qué un curso aparece bloqueado?',
      $$<p>Un curso puede estar bloqueado por prerrequisitos pendientes, traslape de horario, cupo completo o una restricción administrativa.</p><p>Consulta el detalle mostrado por el portal. Si consideras que ya cumples las condiciones, crea un ticket e incluye el código del curso y una captura del mensaje.</p>$$
    ),
    (
      'Matrícula y cursos',
      '¿Cómo solicito un cambio de sección?',
      $$<p>Registra una solicitud con el nombre y código del curso, sección actual, sección solicitada y motivo del cambio. La modificación depende de disponibilidad y autorización académica.</p><p>No abandones la sección actual hasta recibir confirmación, pues enviar la solicitud no garantiza que el cambio haya sido aprobado.</p>$$
    ),
    (
      'Matrícula y cursos',
      '¿Qué hago si asigné un curso por error?',
      $$<p>Comunícate cuanto antes con coordinación académica mediante una solicitud. Indica el curso que debe retirarse y adjunta tu constancia de asignación.</p><p>Los retiros están sujetos al calendario académico y a las políticas vigentes. Evita realizar pagos adicionales hasta recibir instrucciones.</p>$$
    ),
    (
      'Matrícula y cursos',
      '¿Dónde descargo mi constancia de inscripción?',
      $$<p>En el portal académico abre <strong>Asignaciones</strong>, selecciona el ciclo vigente y utiliza la opción <strong>Descargar constancia</strong>.</p><p>Si el documento aparece vacío, verifica que la asignación esté confirmada y habilita las ventanas emergentes del navegador antes de intentarlo nuevamente.</p>$$
    ),
    (
      'Pagos y solvencias',
      '¿Dónde consulto mi saldo pendiente?',
      $$<p>Ingresa al portal académico y abre la sección <strong>Estado de cuenta</strong>. Allí encontrarás cargos, pagos aplicados y saldo pendiente del ciclo.</p><p>La información puede tardar en actualizarse después de un pago. Conserva siempre el comprobante de la transacción.</p>$$
    ),
    (
      'Pagos y solvencias',
      '¿Cuánto tarda en reflejarse un pago?',
      $$<p>Los pagos electrónicos suelen reflejarse dentro de 24 horas hábiles. Los depósitos o transferencias que requieren validación pueden tomar más tiempo.</p><p>Si el plazo ya venció, crea un ticket y adjunta el comprobante legible, fecha, monto y número de autorización. No publiques datos completos de tarjetas.</p>$$
    ),
    (
      'Pagos y solvencias',
      '¿Cómo descargo un comprobante de pago?',
      $$<p>Abre el historial de pagos en tu estado de cuenta, selecciona la transacción y presiona <strong>Descargar comprobante</strong>.</p><p>Si la descarga no inicia, permite ventanas emergentes para el sitio o prueba con otro navegador actualizado.</p>$$
    ),
    (
      'Pagos y solvencias',
      '¿Cómo solicito una solvencia?',
      $$<p>Verifica primero que el estado de cuenta no tenga cargos vencidos. Luego utiliza la opción de solvencias del portal o registra una solicitud dirigida al área administrativa.</p><p>Indica el tipo de solvencia que necesitas y el trámite para el cual será utilizada.</p>$$
    ),
    (
      'Pagos y solvencias',
      '¿Qué hago si aparece un cobro incorrecto?',
      $$<p>No realices un segundo pago para compensar el cargo. Crea una solicitud con la descripción del cobro, ciclo académico, monto y evidencia disponible.</p><p>El área administrativa revisará el movimiento y notificará la corrección o la justificación del cargo mediante el ticket.</p>$$
    ),
    (
      'Soporte técnico',
      '¿Qué información debo incluir en un ticket?',
      $$<p>Describe qué intentabas hacer, qué ocurrió y el mensaje de error exacto. Incluye el nombre de la plataforma, fecha aproximada, navegador y pasos que permitan reproducir el problema.</p><p>Puedes mencionar si ya reiniciaste la sesión o probaste otro navegador. No compartas contraseñas ni datos bancarios.</p>$$
    ),
    (
      'Soporte técnico',
      '¿Cómo limpio la caché del navegador?',
      $$<p>En Chrome, Edge o Firefox presiona <strong>Ctrl + Shift + Supr</strong>. Selecciona archivos e imágenes almacenados en caché, elige el intervalo de tiempo y confirma.</p><p>Cierra el navegador, vuelve a abrirlo e inicia sesión nuevamente. Evita borrar contraseñas guardadas si no recuerdas tus credenciales.</p>$$
    ),
    (
      'Soporte técnico',
      '¿Qué hago si una página queda en blanco?',
      $$<p>Recarga la página con <strong>Ctrl + F5</strong>, verifica tu conexión y prueba una ventana privada. También puedes desactivar temporalmente extensiones que bloqueen contenido.</p><p>Si el problema continúa, registra un incidente e indica la dirección de la página, navegador, dispositivo y hora del error.</p>$$
    ),
    (
      'Soporte técnico',
      '¿Cómo adjunto una captura sin exponer datos sensibles?',
      $$<p>Captura únicamente el área necesaria para mostrar el error. Antes de adjuntarla, oculta contraseñas, números de tarjeta, documentos de identificación y cualquier información privada.</p><p>Asegúrate de que el mensaje de error y el nombre de la plataforma sean legibles.</p>$$
    ),
    (
      'Soporte técnico',
      '¿Cuándo debo crear un incidente o una solicitud?',
      $$<p>Crea un <strong>Incidente</strong> cuando algo que funcionaba dejó de funcionar o existe un error que impide continuar. Crea una <strong>Solicitud</strong> cuando necesitas acceso, información o una gestión planificada.</p><p>Seleccionar la tipología correcta ayuda a asignar el caso al equipo adecuado y calcular el SLA correspondiente.</p>$$
    )
)
INSERT INTO articulos (titulo, contenidomarkdown, vistas, idbase)
SELECT pregunta.titulo, pregunta.contenido, 0, base.idbase
FROM preguntas pregunta
JOIN basesconocimiento base ON LOWER(base.categoria) = LOWER(pregunta.categoria)
WHERE NOT EXISTS (
  SELECT 1
  FROM articulos articulo
  WHERE articulo.idbase = base.idbase
    AND LOWER(articulo.titulo) = LOWER(pregunta.titulo)
);

UPDATE basesconocimiento base
SET totalarticulos = (
  SELECT COUNT(*)
  FROM articulos articulo
  WHERE articulo.idbase = base.idbase
);
