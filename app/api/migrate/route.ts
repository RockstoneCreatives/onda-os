import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-admin-token')
    if (token !== 'onda-admin-secret-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dbPassword } = await request.json()
    if (!dbPassword) {
      return NextResponse.json({ error: 'Database password required' }, { status: 400 })
    }

    const { Client } = await import('pg')
    const client = new Client({
      host: 'xqyktmvouaqryrcbmnvc.db.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
    })

    console.log('Connecting...')
    await client.connect()
    console.log('Connected!')

    const sqlPath = path.join(process.cwd(), '..', '..', '..', '..', 'COPY_TO_SUPABASE_SQL_EDITOR.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    let executed = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i])
        executed++
      } catch (err) {
        const error = err as Error
        errors.push({
          index: i,
          error: error.message,
        })
      }
    }

    await client.end()

    return NextResponse.json({
      success: true,
      executed,
      total: statements.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const err = error as Error
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
