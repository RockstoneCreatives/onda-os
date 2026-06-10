#!/usr/bin/env node

/**
 * Onda OS Database Migration Script
 * Executes SQL migration directly against Supabase PostgreSQL
 *
 * Usage:
 *   node scripts/run-migration.js <postgres-password>
 *
 * To get the password:
 *   1. Go to: https://supabase.com/dashboard/project/xqyktmvouaqryrcbmnvc/settings/database
 *   2. Copy the password from "Database password"
 *   3. Run: node scripts/run-migration.js 'your-password-here'
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const password = args[0]

if (!password) {
  console.error('❌ Error: No password provided')
  console.error('\nUsage: node scripts/run-migration.js <postgres-password>')
  console.error('\nTo get the password:')
  console.error('  1. Go to: https://supabase.com/dashboard/project/xqyktmvouaqryrcbmnvc/settings/database')
  console.error('  2. Copy the password and run this script with it\n')
  process.exit(1)
}

const client = new Client({
  host: 'xqyktmvouaqryrcbmnvc.db.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: password,
})

async function runMigration() {
  try {
    console.log('🔧 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✓ Connected\n')

    // Read migration SQL
    const sqlFile = path.join(__dirname, '../COPY_TO_SUPABASE_SQL_EDITOR.sql')
    let sql = fs.readFileSync(sqlFile, 'utf-8')

    // Remove comments and split by semicolon
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    console.log(`📋 Found ${statements.length} SQL statements\n`)

    let executed = 0
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`)
        await client.query(statement)
        executed++
      } catch (err) {
        console.error(`❌ Error on statement ${i + 1}:`, err.message)
        throw err
      }
    }

    console.log(`\n✅ Successfully executed ${executed} statements!\n`)
    console.log('🎉 Database migration complete!\n')
    console.log('Next steps:')
    console.log('  1. Run: /tmp/onda_venv/bin/python3 scripts/init_db.py')
    console.log('  2. Then test the app at: http://localhost:3000')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
