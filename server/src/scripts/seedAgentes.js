require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const agentes = [
      { nombre: 'Agente Incidentes',  correo: 'incidentes@miumg.edu.gt', especialidad: 'Incidente', nivel: 2, sede: 'Campus Central' },
      { nombre: 'Agente Solicitudes', correo: 'solicitudes@miumg.edu.gt', especialidad: 'Solicitud', nivel: 2, sede: 'Campus Central' },
      { nombre: 'Agente Cambios',     correo: 'cambios@miumg.edu.gt',     especialidad: 'Cambio',    nivel: 2, sede: 'Campus Central' },
    ];

    for (const agente of agentes) {
      const hash = await bcrypt.hash('123456', 10)

      const query = await client.query(
        `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
         VALUES ($1, $2, $3, 'Agente')
         ON CONFLICT (correoinstitucional) DO UPDATE SET
           nombrecompleto = EXCLUDED.nombrecompleto,
           passwordhash = EXCLUDED.passwordhash,
           rol = EXCLUDED.rol
         RETURNING idusuario`,
        [ agente.nombre, agente.correo, hash ]
      )

      const idUsuario = query.rows[0].idusuario

      const update = await client.query(
        `UPDATE agentes
         SET especialidad = $1, nivelacceso = $2, sedeasignada = $3
         WHERE idusuario = $4`,
        [ agente.especialidad, agente.nivel, agente.sede, idUsuario ]
      )

      if (update.rowCount === 0) {
        await client.query(
          `INSERT INTO agentes (especialidad, nivelacceso, sedeasignada, idusuario)
           VALUES ($1, $2, $3, $4)`,
          [ agente.especialidad, agente.nivel, agente.sede, idUsuario ]
        )
      }

      console.log(`${agente.nombre} creado — ${agente.correo} / 123456`)
    }

    await client.query('COMMIT')
    console.log('Agentes creados exitosamente');

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error seeding agentes:', err, " Rolling back transaction.");
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(err => {
  console.error(err)
  process.exitCode = 1
})
