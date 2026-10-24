require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const passwordHash = await bcrypt.hash('123456', 10)

    const resultUsuario = await client.query(
      `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
       VALUES ($1, $2, $3, 'Agente')
       ON CONFLICT (correoinstitucional) DO UPDATE SET
         nombrecompleto = EXCLUDED.nombrecompleto,
         passwordhash = EXCLUDED.passwordhash,
         rol = EXCLUDED.rol
       RETURNING idusuario`,
      ['Agente Soporte UMG', 'agente@miumg.edu.gt', passwordHash]
    )

    const idUsuario = resultUsuario.rows[0].idusuario

    const update = await client.query(
      `UPDATE agentes
       SET especialidad = $1, nivelacceso = $2, sedeasignada = $3
       WHERE idusuario = $4`,
      ['Soporte General', 2, 'Campus Central', idUsuario]
    )

    if (update.rowCount === 0) {
      await client.query(
        `INSERT INTO agentes (especialidad, nivelacceso, sedeasignada, idusuario)
         VALUES ($1, $2, $3, $4)`,
        ['Soporte General', 2, 'Campus Central', idUsuario]
      )
    }

    await client.query('COMMIT')
    console.log('Agente de soporte creado o actualizado')
    console.log('Correo: agente@miumg.edu.gt')
    console.log('Contraseña: 123456')

  } catch (err) {
    await client.query('ROLLBACK')
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
