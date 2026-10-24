require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const { pool } = require('../config/db')

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    await client.query('SELECT pg_advisory_lock($1)', [80423177])

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter(file => /^\d+.*\.sql$/.test(file))
      .sort()

    for (const file of files) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      const checksum = crypto.createHash('sha256').update(sql).digest('hex')
      const applied = await client.query(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        [file]
      )

      if (applied.rows.length > 0) {
        if (applied.rows[0].checksum !== checksum) {
          throw new Error(`La migracion aplicada ${file} fue modificada`)
        }
        continue
      }

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [file, checksum]
        )
        await client.query('COMMIT')
        console.log(`Migracion aplicada: ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [80423177]).catch(() => {})
    client.release()
  }
}

if (require.main === module) {
  migrate()
    .catch(error => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}

module.exports = { migrate }
