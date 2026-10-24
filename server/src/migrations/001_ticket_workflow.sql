ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS fechalimitesla TIMESTAMP,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS idusuariocreador INTEGER REFERENCES usuarios(idusuario);

UPDATE tickets
SET fechalimitesla = COALESCE(fechacreacion, NOW()) + CASE prioridadsla
  WHEN 'Alta' THEN INTERVAL '4 hours'
  WHEN 'Media' THEN INTERVAL '24 hours'
  ELSE INTERVAL '48 hours'
END
WHERE fechalimitesla IS NULL;

UPDATE tickets t
SET idusuariocreador = e.idusuario
FROM estudiante e
WHERE t.idestudiante = e.idestudiante
  AND t.idusuariocreador IS NULL;

ALTER TABLE tickets ALTER COLUMN fechalimitesla SET NOT NULL;

CREATE TABLE IF NOT EXISTS asignacion_cursor (
  especialidad VARCHAR(100) PRIMARY KEY,
  ultimoidagente INTEGER REFERENCES agentes(idagente) ON DELETE SET NULL,
  fechaactualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_asignacion_cursor_especialidad
    CHECK (especialidad IN ('Incidente', 'Solicitud', 'Cambio'))
);

CREATE TABLE IF NOT EXISTS mensajes_ticket (
  idmensaje BIGSERIAL PRIMARY KEY,
  idticket INTEGER NOT NULL REFERENCES tickets(idticket) ON DELETE CASCADE,
  idusuario INTEGER NOT NULL REFERENCES usuarios(idusuario),
  contenido TEXT NOT NULL,
  fechacreacion TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_mensajes_ticket_contenido
    CHECK (char_length(btrim(contenido)) BETWEEN 1 AND 4000)
);

CREATE TABLE IF NOT EXISTS eventos_ticket (
  idevento BIGSERIAL PRIMARY KEY,
  idticket INTEGER NOT NULL REFERENCES tickets(idticket) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  idusuario INTEGER REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  versionticket INTEGER NOT NULL,
  datos JSONB NOT NULL DEFAULT '{}'::jsonb,
  fechacreacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_tickets_agente_estado
  ON tickets (idagente, estado);
CREATE INDEX IF NOT EXISTS ix_tickets_estudiante_fecha
  ON tickets (idestudiante, fechacreacion DESC);
CREATE INDEX IF NOT EXISTS ix_tickets_tipologia_agente
  ON tickets (tipologiaitil, idagente);
CREATE INDEX IF NOT EXISTS ix_tickets_fecha_limite_activos
  ON tickets (fechalimitesla) WHERE estado <> 'Cerrado';
CREATE INDEX IF NOT EXISTS ix_agentes_especialidad
  ON agentes (especialidad, idagente);
CREATE INDEX IF NOT EXISTS ix_mensajes_ticket_orden
  ON mensajes_ticket (idticket, idmensaje);
CREATE INDEX IF NOT EXISTS ix_eventos_ticket_orden
  ON eventos_ticket (idticket, idevento);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_tickets_version_positiva' AND conrelid = 'tickets'::regclass) THEN
    ALTER TABLE tickets ADD CONSTRAINT ck_tickets_version_positiva CHECK (version > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_tickets_prioridad' AND conrelid = 'tickets'::regclass) THEN
    ALTER TABLE tickets ADD CONSTRAINT ck_tickets_prioridad CHECK (prioridadsla IN ('Alta', 'Media', 'Baja'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_tickets_tipologia' AND conrelid = 'tickets'::regclass) THEN
    ALTER TABLE tickets ADD CONSTRAINT ck_tickets_tipologia CHECK (tipologiaitil IN ('Incidente', 'Solicitud', 'Cambio'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_tickets_estado' AND conrelid = 'tickets'::regclass) THEN
    ALTER TABLE tickets ADD CONSTRAINT ck_tickets_estado CHECK (estado IN ('Abierto', 'EnProceso', 'Pendiente', 'Resuelto', 'Cerrado'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_asignacion_cursor_especialidad' AND conrelid = 'asignacion_cursor'::regclass) THEN
    ALTER TABLE asignacion_cursor ADD CONSTRAINT ck_asignacion_cursor_especialidad
      CHECK (especialidad IN ('Incidente', 'Solicitud', 'Cambio'));
  END IF;
END $$;
