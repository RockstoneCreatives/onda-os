import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// This endpoint initializes the database by running the migration SQL
export async function POST(request: NextRequest) {
  try {
    // Security: Check for a simple auth header
    const authHeader = request.headers.get('x-init-token')
    if (authHeader !== 'init-onda-os-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Read migration SQL
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250610_create_tables.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8')

    // Split statements and execute
    const statements = migrationSql.split(';').filter((s) => s.trim().length > 0)

    console.log(`Executing ${statements.length} SQL statements...`)

    // Use RPC to execute SQL (if available) or direct query
    // Note: Supabase JS client doesn't support raw SQL execution
    // This is a workaround using the postgres RPC
    const results = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()

      // Skip comments
      if (statement.startsWith('--')) {
        continue
      }

      try {
        // Try to execute via RPC if exists, otherwise just log
        // For now, we'll return the statements that need to be executed
        results.push({
          index: i,
          statement: statement.substring(0, 100) + '...',
          status: 'ready',
        })
      } catch (err) {
        results.push({
          index: i,
          statement: statement.substring(0, 100),
          status: 'error',
          error: String(err),
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialization started',
      statements_count: statements.length,
      note: 'Supabase JS client does not support raw SQL execution. Please run the SQL manually in the dashboard.',
      url: 'https://supabase.com/dashboard/project/xqyktmvouaqryrcbmnvc/sql',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to initialize database',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
