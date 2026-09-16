/**
 * Applies supabase/schema.sql using DATABASE_URL from the environment.
 * Run: node --env-file=.env.local scripts/apply-schema.js
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const run = async () => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  await client.query(sql)
  console.log('Schema applied successfully')
  await client.end()
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
