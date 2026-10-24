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
