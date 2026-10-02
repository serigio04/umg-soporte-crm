const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
  ssl: { rejectUnauthorized: false }
})

async function initDB() {
  try {
    await pool.query('SELECT 1')
    console.log('Conexión a Neon PostgreSQL establecida')
  } catch (error) {
    console.error('Error al conectar a Neon PostgreSQL:', error)
    process.exit(1)
  } 
}

async function getConnection() {
  return await pool.connect()
}

module.exports = { initDB, getConnection, pool }