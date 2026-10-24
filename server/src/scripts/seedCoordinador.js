require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash('123456', 10)

    const userRes = await client.query(
      `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
       VALUES ($1, $2, $3, 'Coordinador')
       ON CONFLICT (correoinstitucional) DO UPDATE SET
         nombrecompleto = EXCLUDED.nombrecompleto,
         passwordhash = EXCLUDED.passwordhash,
         rol = EXCLUDED.rol
       RETURNING idusuario`,
      ['Coordinador UMG', 'coordinador@miumg.edu.gt', hash]
    )

    const idUsuario = userRes.rows[0].idusuario

    const update = await client.query(
      `UPDATE agentes
       SET especialidad = $1, nivelacceso = $2, sedeasignada = $3
       WHERE idusuario = $4`,
      ['General', 3, 'Campus Central', idUsuario]
    )

    if (update.rowCount === 0) {
      await client.query(
        `INSERT INTO agentes (especialidad, nivelacceso, sedeasignada, idusuario)
         VALUES ($1, $2, $3, $4)`,
        ['General', 3, 'Campus Central', idUsuario]
      )
    }

    await client.query('COMMIT')
    console.log('Coordinador creado — coordinador@miumg.edu.gt / 123456')

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
