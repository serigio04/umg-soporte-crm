const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
  ssl: { rejectUnauthorized: false }
})

async function getConnection() {
  return await pool.connect()
}

module.exports = { getConnection, pool }