require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  const passwordHash = await bcrypt.hash('123456', 10)

  await pool.query(
    `INSERT INTO usuarios (nombrecompleto, correoinstitucional, passwordhash, rol)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (correoinstitucional) DO UPDATE SET
       nombrecompleto = EXCLUDED.nombrecompleto,
       passwordhash = EXCLUDED.passwordhash,
       rol = EXCLUDED.rol`,
    ['Sergio Gomar', 'sergio@miumg.edu.gt', passwordHash, 'Estudiante']
  )

  console.log('Usuario de prueba creado o actualizado')
  await pool.end()
}

seed().catch(err => {
  console.error(err)
  process.exitCode = 1
})
