require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool, initDB } = require('../config/db')

async function crearTablas() {
  await initDB()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Usuarios (
      IdUsuario             SERIAL PRIMARY KEY,
      NombreCompleto        VARCHAR(100) NOT NULL,
      CorreoInstitucional   VARCHAR(100) NOT NULL UNIQUE,
      PasswordHash          VARCHAR(256) NOT NULL,
      Rol                   VARCHAR(20)  NOT NULL DEFAULT 'Estudiante'
    );

    CREATE TABLE IF NOT EXISTS Estudiante (
      IdEstudiante      SERIAL PRIMARY KEY,
      Carne             VARCHAR(20)     NOT NULL,
      Carrera           VARCHAR(100)    NOT NULL,
      SaldoActual       DECIMAL(10,2)   DEFAULT 0,
      IdUsuario         INTEGER         REFERENCES Usuarios(IdUsuario)
    );

    CREATE TABLE IF NOT EXISTS Agentes (
      IdAgente      SERIAL PRIMARY KEY,
      Especialidad  VARCHAR(100) NOT NULL,
      NivelAcceso   INTEGER      DEFAULT 1,
      SedeAsignada  VARCHAR(100) NOT NULL,
      IdUsuario     INTEGER      REFERENCES Usuarios(IdUsuario)
    );

    CREATE TABLE IF NOT EXISTS Tickets (
      IdTicket      SERIAL PRIMARY KEY,
      FechaCreacion TIMESTAMP    DEFAULT NOW(),
      FechaLimiteSLA TIMESTAMP   NOT NULL,
      PrioridadSLA  VARCHAR(10)  NOT NULL DEFAULT 'Baja' CHECK (PrioridadSLA IN ('Alta', 'Media', 'Baja')),
      TipologiaITIL VARCHAR(20)  NOT NULL DEFAULT 'Solicitud' CHECK (TipologiaITIL IN ('Incidente', 'Solicitud', 'Cambio')),
      Estado        VARCHAR(20)  NOT NULL DEFAULT 'Abierto' CHECK (Estado IN ('Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado')),
      Descripcion   VARCHAR(1000),
      IdEstudiante  INTEGER      REFERENCES Estudiante(IdEstudiante),
      IdAgente      INTEGER      REFERENCES Agentes(IdAgente),
      IdUsuarioCreador INTEGER    REFERENCES Usuarios(IdUsuario),
      Version       INTEGER      NOT NULL DEFAULT 1 CHECK (Version > 0)
    );

    CREATE TABLE IF NOT EXISTS Asignacion_Cursor (
      Especialidad       VARCHAR(100) PRIMARY KEY CHECK (Especialidad IN ('Incidente', 'Solicitud', 'Cambio')),
      UltimoIdAgente     INTEGER REFERENCES Agentes(IdAgente) ON DELETE SET NULL,
      FechaActualizacion TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS Mensajes_Ticket (
      IdMensaje    BIGSERIAL PRIMARY KEY,
      IdTicket     INTEGER NOT NULL REFERENCES Tickets(IdTicket) ON DELETE CASCADE,
      IdUsuario    INTEGER NOT NULL REFERENCES Usuarios(IdUsuario),
      Contenido    TEXT NOT NULL CHECK (char_length(btrim(Contenido)) BETWEEN 1 AND 4000),
      FechaCreacion TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS Eventos_Ticket (
      IdEvento      BIGSERIAL PRIMARY KEY,
      IdTicket      INTEGER NOT NULL REFERENCES Tickets(IdTicket) ON DELETE CASCADE,
      Tipo          VARCHAR(50) NOT NULL,
      IdUsuario     INTEGER REFERENCES Usuarios(IdUsuario) ON DELETE SET NULL,
      VersionTicket INTEGER NOT NULL,
      Datos         JSONB NOT NULL DEFAULT '{}'::jsonb,
      FechaCreacion TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS EstadosTicket (
      IdEstado          SERIAL PRIMARY KEY,
      NombreEstado      VARCHAR(20)   NOT NULL,
      FechaCambio       TIMESTAMP     DEFAULT NOW(),
      ComentarioTecnico VARCHAR(500),
      IdTicket          INTEGER       REFERENCES Tickets(IdTicket)
    );

    CREATE TABLE IF NOT EXISTS BasesConocimiento (
      IdBase        SERIAL PRIMARY KEY,
      Categoria     VARCHAR(100) NOT NULL,
      TotalArticulos INTEGER     DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Articulos (
      IdArticulo        SERIAL PRIMARY KEY,
      Titulo            VARCHAR(200) NOT NULL,
      ContenidoMarkdown TEXT         NOT NULL,
      Vistas            INTEGER      DEFAULT 0,
      IdBase            INTEGER      REFERENCES BasesConocimiento(IdBase)
    );

    CREATE TABLE IF NOT EXISTS encuestas (
      idencuesta SERIAL PRIMARY KEY,
      idticket INTEGER REFERENCES tickets(idticket),
      idestudiante INTEGER REFERENCES estudiante(idestudiante),
      calificacion INTEGER,
      comentario VARCHAR(500),
      fechacreacion TIMESTAMP DEFAULT NOW(),
      fecharespuesta TIMESTAMP
    );

    WITH encuestas_duplicadas AS (
      SELECT idencuesta,
             ROW_NUMBER() OVER (
               PARTITION BY idticket
               ORDER BY (fecharespuesta IS NOT NULL) DESC, idencuesta
             ) AS posicion
      FROM encuestas
      WHERE idticket IS NOT NULL
    )
    DELETE FROM encuestas
    WHERE idencuesta IN (
      SELECT idencuesta FROM encuestas_duplicadas WHERE posicion > 1
    );

    CREATE UNIQUE INDEX IF NOT EXISTS ux_encuestas_idticket
      ON encuestas (idticket);
    CREATE INDEX IF NOT EXISTS ix_tickets_agente_estado ON tickets (idagente, estado);
    CREATE INDEX IF NOT EXISTS ix_tickets_estudiante_fecha ON tickets (idestudiante, fechacreacion DESC);
    CREATE INDEX IF NOT EXISTS ix_tickets_tipologia_agente ON tickets (tipologiaitil, idagente);
    CREATE INDEX IF NOT EXISTS ix_tickets_fecha_limite_activos ON tickets (fechalimitesla) WHERE estado <> 'Cerrado';
    CREATE INDEX IF NOT EXISTS ix_agentes_especialidad ON agentes (especialidad, idagente);
    CREATE INDEX IF NOT EXISTS ix_mensajes_ticket_orden ON mensajes_ticket (idticket, idmensaje);
    CREATE INDEX IF NOT EXISTS ix_eventos_ticket_orden ON eventos_ticket (idticket, idevento);
  `)

  console.log('✅ Tablas creadas en Neon')
  await pool.end()
  process.exit()
}

crearTablas().catch(async (error) => {
  console.error(error)
  await pool.end()
  process.exitCode = 1
})
